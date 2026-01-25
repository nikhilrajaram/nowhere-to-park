import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CityData, Env } from './types';

export async function getFromS3(env: Env, key: string): Promise<CityData | null> {
  const s3 = new S3Client({
    region: env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: key,
    });

    const response = await s3.send(command);
    if (response.Body) {
      const str = await response.Body.transformToString();
      return JSON.parse(str);
    }
  } catch (err) {
    // ignore 404s (NoSuchKey), throw others
    if ((err as any).name !== 'NoSuchKey') {
      console.warn('Error fetching from S3:', err);
    }
  }
  return null;
}

export async function uploadToS3(env: Env, key: string, data: CityData): Promise<void> {
  const s3 = new S3Client({
    region: env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
    CacheControl: 'public, max-age=2592000',
  });

  await s3.send(command);
}
