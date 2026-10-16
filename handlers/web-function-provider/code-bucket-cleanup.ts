import { DeleteObjectsCommand, ListObjectVersionsCommand, S3Client } from '@aws-sdk/client-s3';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import type { HandlerResponse } from './index';
import type { CodeBucketCleanupProperties } from '../../src/private/provider-protocol';

const s3 = new S3Client({});

/**
 * Empties the code bucket on delete, so CloudFormation can delete it. The resource depends on the bucket and is
 * only removed with it: when the stack is deleted, or when its last Web Function is removed.
 */
export async function handleCodeBucketCleanup(event: CloudFormationCustomResourceEvent): Promise<HandlerResponse> {
  const props = event.ResourceProperties as unknown as CodeBucketCleanupProperties;
  if (event.RequestType !== 'Delete') {
    return { PhysicalResourceId: props.BucketName };
  }
  // A replaced bucket gets a new physical id, so the old resource is deleted with the old bucket.
  const bucket = event.PhysicalResourceId;
  try {
    // Each page has at most 1,000 versions and delete markers, which is also DeleteObjects' limit.
    let marker: { KeyMarker?: string; VersionIdMarker?: string } = {};
    for (;;) {
      const page = await s3.send(new ListObjectVersionsCommand({ Bucket: bucket, ...marker }));
      const objects = [...(page.Versions ?? []), ...(page.DeleteMarkers ?? [])].map((o) => ({ Key: o.Key!, VersionId: o.VersionId }));
      if (objects.length > 0) {
        const res = await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } }));
        if (res.Errors?.length) {
          throw new Error(`could not delete ${res.Errors.length} object version(s) from ${bucket}: ${res.Errors[0].Code} ${res.Errors[0].Message}`);
        }
      }
      if (!page.IsTruncated) break;
      marker = { KeyMarker: page.NextKeyMarker, VersionIdMarker: page.NextVersionIdMarker };
    }
  } catch (e) {
    if ((e as Error).name !== 'NoSuchBucket') throw e;
  }
  return { PhysicalResourceId: event.PhysicalResourceId };
}
