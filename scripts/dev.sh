#!/usr/bin/env sh
# dev runner: launches webapp and worker (with configurable backend: s3 or minio)

set -eu

backend=minio
while [ $# -gt 0 ]; do
  case "$1" in
    --backend) backend="${2:-}"; shift 2 ;;
    --backend=*) backend="${1#*=}"; shift ;;
    --) shift ;;
    *) echo "dev: unknown argument '$1' (only --backend [minio|s3])" >&2; exit 1 ;;
  esac
done

web='pnpm run dev:web'

case "$backend" in
  minio)
    # bring up MinIO + seed
    docker compose up \
      -d \
      --wait # block until healthy
    # seed and block on success
    docker compose run --rm seed-data
    # extract MinIO API port for `AWS_ENDPOINT_URL_S3`
    port=$(docker compose port minio 9000 2>/dev/null | head -n1 | sed 's/.*://')
    [ -n "$port" ] || { echo "dev: could not determine MinIO host port" >&2; exit 1; }
    worker="pnpm --dir worker exec wrangler dev --var AWS_ENDPOINT_URL_S3:http://127.0.0.1:$port --var AWS_ACCESS_KEY_ID:minioadmin --var AWS_SECRET_ACCESS_KEY:minioadmin --var S3_BUCKET_NAME:nowhere-to-park --var S3_REGION:us-east-1"
    ;;
  s3)
    worker='pnpm --dir worker run dev'
    ;;
  *)
    echo "dev: unknown --backend '$backend' (use 'minio' or 's3')" >&2
    exit 1
    ;;
esac

exec pnpm exec concurrently -n web,worker -c cyan,magenta "$web" "$worker"
