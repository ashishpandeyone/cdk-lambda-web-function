import { CopyObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';
import type { HandlerResponse } from './index';
import type { CodeProperties } from '../../src/private/provider-protocol';

const s3 = new S3Client({});

/** Metadata key recording which source object the destination was copied from. */
export const SOURCE_METADATA_KEY = 'lambda-web-source';

/**
 * Copies the code zip into the (versioned) code bucket with a server-side copy and
 * returns the destination's version id, which the revision pins.
 *
 * Copying is skipped when the destination's current version already came from the same
 * source, so re-running the resource doesn't create a new object version (and therefore
 * doesn't force a new revision).
 */
export async function handleCode(event: CloudFormationCustomResourceEvent): Promise<HandlerResponse> {
  const props = event.ResourceProperties as unknown as CodeProperties;
  const physicalResourceId = `s3://${props.DestinationBucket}/${props.DestinationKey}`;

  // Objects are kept on delete: revisions capture their code at creation, and the
  // bucket's lifecycle rule expires superseded versions.
  if (event.RequestType === 'Delete') {
    return { PhysicalResourceId: event.PhysicalResourceId };
  }

  const source = `${props.SourceBucket}/${props.SourceKey}${props.SourceVersion ? `?versionId=${props.SourceVersion}` : ''}`;

  const existing = await withStatus('HeadObject on the code bucket', () => currentVersion(props.DestinationBucket, props.DestinationKey));
  if (existing?.source === source && existing.versionId) {
    return { PhysicalResourceId: physicalResourceId, Data: { VersionId: existing.versionId } };
  }

  const copy = await withStatus(`CopyObject from ${source}`, () => s3.send(new CopyObjectCommand({
    Bucket: props.DestinationBucket,
    Key: props.DestinationKey,
    CopySource: encodeURI(source),
    MetadataDirective: 'REPLACE',
    Metadata: { [SOURCE_METADATA_KEY]: source },
  })));
  if (!copy.VersionId) {
    throw new Error(`Code bucket ${props.DestinationBucket} must have versioning enabled: Lambda Web Functions reject unversioned code objects`);
  }
  return { PhysicalResourceId: physicalResourceId, Data: { VersionId: copy.VersionId } };
}

async function currentVersion(bucket: string, key: string): Promise<{ versionId?: string; source?: string } | undefined> {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { versionId: head.VersionId, source: head.Metadata?.[SOURCE_METADATA_KEY] };
  } catch (e) {
    if (isNotFound(e)) return undefined;
    throw e;
  }
}

/**
 * S3 errors without a body (e.g. a 403 on HEAD) surface as "UnknownError"; add what failed and the HTTP status.
 */
async function withStatus<T>(what: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const err = e as Error & { $metadata?: { httpStatusCode?: number } };
    err.message = `${what} failed: ${err.name} (HTTP ${err.$metadata?.httpStatusCode ?? '?'}): ${err.message}`;
    throw err;
  }
}

function isNotFound(e: unknown): boolean {
  const err = e as { name?: string; $metadata?: { httpStatusCode?: number } };
  return err.name === 'NotFound' || err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404;
}
