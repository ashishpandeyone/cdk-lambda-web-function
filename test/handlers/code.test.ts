import { CopyObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { cfnEvent } from './events';
import { SOURCE_METADATA_KEY } from '../../handlers/web-function-provider/code';
import { handler } from '../../handlers/web-function-provider/index';
import { CODE_RESOURCE_TYPE } from '../../src/private/provider-protocol';

const s3 = mockClient(S3Client);
const props = { SourceBucket: 'cdk-assets', SourceKey: 'abc123.zip', DestinationBucket: 'code-bucket', DestinationKey: 'web-functions/abc123.zip' };
const notFound = Object.assign(new Error('NotFound'), { name: 'NotFound', $metadata: { httpStatusCode: 404 } });

beforeEach(() => s3.reset());

test('copies the asset into the code bucket and returns the new version', async () => {
  s3.on(HeadObjectCommand).rejects(notFound);
  s3.on(CopyObjectCommand).resolves({ VersionId: 'v1' });

  const res = await handler(cfnEvent('Create', CODE_RESOURCE_TYPE, props));

  expect(res).toEqual({ PhysicalResourceId: 's3://code-bucket/web-functions/abc123.zip', Data: { VersionId: 'v1' } });
  expect(s3.commandCalls(CopyObjectCommand)[0].args[0].input).toEqual({
    Bucket: 'code-bucket',
    Key: 'web-functions/abc123.zip',
    CopySource: 'cdk-assets/abc123.zip',
    MetadataDirective: 'REPLACE',
    Metadata: { [SOURCE_METADATA_KEY]: 'cdk-assets/abc123.zip' },
  });
});

test('pins the source version when one is given', async () => {
  s3.on(HeadObjectCommand).rejects(notFound);
  s3.on(CopyObjectCommand).resolves({ VersionId: 'v2' });

  await handler(cfnEvent('Create', CODE_RESOURCE_TYPE, { ...props, SourceVersion: 'src v1' }));

  expect(s3.commandCalls(CopyObjectCommand)[0].args[0].input.CopySource).toBe('cdk-assets/abc123.zip?versionId=src%20v1');
});

test('reuses the current version when it was copied from the same source', async () => {
  s3.on(HeadObjectCommand).resolves({ VersionId: 'v1', Metadata: { [SOURCE_METADATA_KEY]: 'cdk-assets/abc123.zip' } });

  const res = await handler(cfnEvent('Update', CODE_RESOURCE_TYPE, props));

  expect(res.Data).toEqual({ VersionId: 'v1' });
  expect(s3.commandCalls(CopyObjectCommand)).toHaveLength(0);
});

test('copies again when the current version came from a different source', async () => {
  s3.on(HeadObjectCommand).resolves({ VersionId: 'v1', Metadata: { [SOURCE_METADATA_KEY]: 'other/object.zip' } });
  s3.on(CopyObjectCommand).resolves({ VersionId: 'v2' });

  const res = await handler(cfnEvent('Update', CODE_RESOURCE_TYPE, props));

  expect(res.Data).toEqual({ VersionId: 'v2' });
});

test('fails clearly when the code bucket is not versioned', async () => {
  s3.on(HeadObjectCommand).rejects(notFound);
  s3.on(CopyObjectCommand).resolves({});

  await expect(handler(cfnEvent('Create', CODE_RESOURCE_TYPE, props))).rejects.toThrow(/must have versioning enabled/);
});

test('keeps objects on delete', async () => {
  const res = await handler(cfnEvent('Delete', CODE_RESOURCE_TYPE, props, 's3://code-bucket/web-functions/abc123.zip'));

  expect(res).toEqual({ PhysicalResourceId: 's3://code-bucket/web-functions/abc123.zip' });
  expect(s3.calls()).toHaveLength(0);
});

test('reports what failed and the HTTP status for body-less S3 errors', async () => {
  s3.on(HeadObjectCommand).rejects(Object.assign(new Error('UnknownError'), { name: 'Unknown', $metadata: { httpStatusCode: 403 } }));

  await expect(handler(cfnEvent('Create', CODE_RESOURCE_TYPE, props))).rejects.toThrow('HeadObject on the code bucket failed: Unknown (HTTP 403)');
});
