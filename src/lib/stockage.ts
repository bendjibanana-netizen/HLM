// Stockage des images, compatible S3 (RustFS en local, Cloudflare R2 en production).
import "server-only";
import {
  CreateBucketCommand,
  DeleteObjectsCommand,
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
 * Crée le bucket s'il n'existe pas et autorise la lecture publique des fichiers.
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
        Resource: [`arn:aws:s3:::${env.S3_BUCKET}/*`],
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
