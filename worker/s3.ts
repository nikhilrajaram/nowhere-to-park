import { S3Client } from '@aws-sdk/client-s3';
import { Env } from './types';

export function getS3Client(env: Env): S3Client {
  return new S3Client({
    region: env.S3_REGION || 'us-east-1',
    ...(env.AWS_ENDPOINT_URL_S3
      ? {
          endpoint: env.AWS_ENDPOINT_URL_S3,
          // MinIO requires path-style addressing
          forcePathStyle: true,
        }
      : {}),
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}
