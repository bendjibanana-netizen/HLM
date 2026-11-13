// Stockage des images, compatible S3 (RustFS en local, Cloudflare R2 en production).
import "server-only";
import {
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  // Adresses de la forme http://hote/bucket/cle, attendues par RustFS et R2.
  forcePathStyle: true,
  credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
});

/**
 * Dossiers lisibles par tous (images affichées sur le site). Tout le reste — fichiers originaux
 * envoyés par les équipes, preuves d'autorisation — n'est accessible qu'au serveur.
 */
export const DOSSIERS_PUBLICS = ["demo", "series", "equipes"] as const;

/**
 * Crée le bucket s'il n'existe pas et autorise la lecture publique des dossiers d'images.
 * Utile en local uniquement : en production, le bucket et son domaine public
 * sont configurés une fois chez l'hébergeur.
 */
export async function assurerBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
  }
  const politique = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: DOSSIERS_PUBLICS.map((dossier) => `arn:aws:s3:::${env.S3_BUCKET}/${dossier}/*`),
      },
    ],
  };
  await s3.send(new PutBucketPolicyCommand({ Bucket: env.S3_BUCKET, Policy: JSON.stringify(politique) }));
}

/**
 * Dépose un fichier. Les clés contiennent une empreinte du contenu : un fichier
 * n'est jamais modifié après coup, d'où la mise en cache d'un an côté navigateur et CDN.
 */
export async function deposerFichier(cle: string, contenu: Buffer, typeMime: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: cle,
      Body: contenu,
      ContentType: typeMime,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

/** Lit un fichier du stockage (y compris dans les dossiers privés). */
export async function lireFichier(cle: string): Promise<Buffer> {
  const reponse = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: cle }));
  if (!reponse.Body) throw new Error(`Fichier introuvable dans le stockage : ${cle}`);
  return Buffer.from(await reponse.Body.transformToByteArray());
}

/** Dépose un fichier privé (original envoyé par une équipe, preuve d'autorisation) : jamais mis en cache public. */
export async function deposerFichierPrive(cle: string, contenu: Buffer, typeMime: string): Promise<void> {
  await s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: cle, Body: contenu, ContentType: typeMime }));
}

/** Supprime tous les fichiers dont la clé commence par le préfixe (ex. « demo/ »). */
export async function supprimerPrefixe(prefixe: string): Promise<number> {
  let supprimes = 0;
  let suite: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({ Bucket: env.S3_BUCKET, Prefix: prefixe, ContinuationToken: suite }),
    );
    const cles = (page.Contents ?? []).flatMap((objet) => (objet.Key ? [{ Key: objet.Key }] : []));
    if (cles.length > 0) {
      await s3.send(new DeleteObjectsCommand({ Bucket: env.S3_BUCKET, Delete: { Objects: cles } }));
      supprimes += cles.length;
    }
    suite = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (suite);
  return supprimes;
}
