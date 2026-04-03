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

export { BUCKET_NAME };
