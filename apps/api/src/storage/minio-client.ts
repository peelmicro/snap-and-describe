import * as Minio from "minio";

const BUCKET_NAME = "images";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ROOT_USER || "minioadmin",
  secretKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
});

export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME);
  }
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await ensureBucket();
  await minioClient.putObject(BUCKET_NAME, key, buffer, buffer.length, {
    "Content-Type": contentType,
  });
  return `${BUCKET_NAME}/${key}`;
}

export async function downloadBuffer(key: string): Promise<Buffer> {
  const stream = await minioClient.getObject(BUCKET_NAME, key);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function deleteObject(key: string): Promise<void> {
  await minioClient.removeObject(BUCKET_NAME, key);
}

export async function getPresignedUrl(
  key: string,
  expirySeconds = 3600
): Promise<string> {
  return minioClient.presignedGetObject(BUCKET_NAME, key, expirySeconds);
}

export { BUCKET_NAME };
