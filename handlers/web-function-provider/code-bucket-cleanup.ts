import { DeleteObjectsCommand, GetBucketTaggingCommand, ListObjectVersionsCommand, S3Client } from '@aws-sdk/client-s3';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import type { HandlerResponse } from './index';
import { EMPTY_ON_DELETE_TAG, type CodeBucketCleanupProperties } from '../../src/private/provider-protocol';

const s3 = new S3Client({});

/**
 * Empties the code bucket on delete, so CloudFormation can delete it. The resource depends on the bucket and is
 * removed with it: when the stack is deleted, or when its last Web Function is removed.
 *
 * It is also deleted, without the bucket, when an update that added it to an existing bucket (an upgrade from a
 * version that used autoDeleteObjects) rolls back. The bucket must keep its code then, so it's only emptied while it
 * carries EMPTY_ON_DELETE_TAG, which the rollback has already removed.
 */
export async function handleCodeBucketCleanup(event: CloudFormationCustomResourceEvent): Promise<HandlerResponse> {
  const props = event.ResourceProperties as unknown as CodeBucketCleanupProperties;
  if (event.RequestType !== 'Delete') {
    return { PhysicalResourceId: props.BucketName };
  }
  // A replaced bucket gets a new physical id, so the old resource is deleted with the old bucket.
  const bucket = event.PhysicalResourceId;
  try {
    if (!(await taggedForEmptying(bucket))) {
      console.log(JSON.stringify({ msg: 'code bucket kept: not tagged for emptying (rollback of an update that added this resource)', bucket }));
      return { PhysicalResourceId: event.PhysicalResourceId };
    }
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

async function taggedForEmptying(bucket: string): Promise<boolean> {
  try {
    const { TagSet } = await s3.send(new GetBucketTaggingCommand({ Bucket: bucket }));
    return (TagSet ?? []).some((t) => t.Key === EMPTY_ON_DELETE_TAG.key && t.Value === EMPTY_ON_DELETE_TAG.value);
  } catch (e) {
    if ((e as Error).name === 'NoSuchTagSet') return false;
    throw e;
  }
}
