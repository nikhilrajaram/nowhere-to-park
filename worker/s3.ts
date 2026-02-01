import { S3Client } from '@aws-sdk/client-s3';
import { Env } from './types';

export function getS3Client(env: Env) {
  return new S3Client({
    region: env.S3_REGION || 'us-east-1',
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
}
