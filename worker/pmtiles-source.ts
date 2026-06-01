import { GetObjectCommand } from '@aws-sdk/client-s3';
import { RangeResponse, Source } from 'pmtiles';
import { getS3Client } from './s3';
import { Env } from './types';

export class S3Source implements Source {
  env: Env;
  key: string;

  constructor(env: Env, key: string) {
    this.env = env;
    this.key = key;
  }

  getKey() {
    return this.key;
  }

  async getBytes(
    offset: number,
    length: number,
    signal?: AbortSignal,
    etag?: string
  ): Promise<RangeResponse> {
    const s3 = getS3Client(this.env);

    const command = new GetObjectCommand({
      Bucket: this.env.S3_BUCKET_NAME,
      Key: this.key,
      Range: `bytes=${offset}-${offset + length - 1}`,
      IfMatch: etag,
    });

    const response = await s3.send(command, { abortSignal: signal });

    if (!response.Body) {
      throw new Error('No body in S3 response');
    }

    const byteArray = await response.Body.transformToByteArray();

    return {
      // transformToByteArray() may return a Uint8Array that is a view into a larger pooled
      // ArrayBuffer. Passing byteArray.buffer directly would give PMTiles the entire buffer with
      // extraneous bytes before/after the payload. slice() produces a standalone ArrayBuffer starting
      // at offset 0 that contains exactly the bytes belonging to this range response.
      data: byteArray.buffer.slice(
        byteArray.byteOffset,
        byteArray.byteOffset + byteArray.byteLength
      ) as ArrayBuffer,
      etag: response.ETag,
      cacheControl: response.CacheControl,
    };
  }
}
