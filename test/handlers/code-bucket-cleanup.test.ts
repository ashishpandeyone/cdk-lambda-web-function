import { DeleteObjectsCommand, GetBucketTaggingCommand, ListObjectVersionsCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { cfnEvent } from './events';
import { handler } from '../../handlers/web-function-provider/index';
import { CODE_BUCKET_CLEANUP_RESOURCE_TYPE } from '../../src/private/provider-protocol';

const s3 = mockClient(S3Client);
const props = { BucketName: 'code-bucket' };

const tagged = () => s3.on(GetBucketTaggingCommand).resolves({ TagSet: [{ Key: 'other', Value: 'x' }, { Key: 'cdk-lambda-web:empty-on-delete', Value: 'true' }] });

beforeEach(() => {
  s3.reset();
  tagged();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

test.each(['Create', 'Update'] as const)('%s does nothing and records the bucket', async (requestType) => {
  const res = await handler(cfnEvent(requestType, CODE_BUCKET_CLEANUP_RESOURCE_TYPE, props));
  expect(res).toEqual({ PhysicalResourceId: 'code-bucket' });
  expect(s3.calls()).toHaveLength(0);
});

test('delete removes every object version and delete marker, page by page', async () => {
  s3.on(ListObjectVersionsCommand)
    .resolvesOnce({
      Versions: [{ Key: 'web-functions/a.zip', VersionId: 'v1' }, { Key: 'web-functions/a.zip', VersionId: 'v2' }],
      DeleteMarkers: [{ Key: 'web-functions/b.zip', VersionId: 'm1' }],
      IsTruncated: true,
      NextKeyMarker: 'web-functions/b.zip',
      NextVersionIdMarker: 'm1',
    })
    .resolvesOnce({ Versions: [{ Key: 'web-functions/c.zip', VersionId: 'v3' }], IsTruncated: false });
  s3.on(DeleteObjectsCommand).resolves({});

  const res = await handler(cfnEvent('Delete', CODE_BUCKET_CLEANUP_RESOURCE_TYPE, props, 'code-bucket'));

  expect(res).toEqual({ PhysicalResourceId: 'code-bucket' });
  const lists = s3.commandCalls(ListObjectVersionsCommand).map((c) => c.args[0].input);
  expect(lists).toEqual([
    { Bucket: 'code-bucket' },
    { Bucket: 'code-bucket', KeyMarker: 'web-functions/b.zip', VersionIdMarker: 'm1' },
  ]);
  expect(s3.commandCalls(DeleteObjectsCommand).map((c) => c.args[0].input)).toEqual([
    {
      Bucket: 'code-bucket',
      Delete: {
        Quiet: true,
        Objects: [
          { Key: 'web-functions/a.zip', VersionId: 'v1' }, { Key: 'web-functions/a.zip', VersionId: 'v2' }, { Key: 'web-functions/b.zip', VersionId: 'm1' },
        ],
      },
    },
    { Bucket: 'code-bucket', Delete: { Quiet: true, Objects: [{ Key: 'web-functions/c.zip', VersionId: 'v3' }] } },
  ]);
});

test('delete empties the bucket named by the physical id (the old one after a replacement)', async () => {
  s3.on(ListObjectVersionsCommand).resolves({ IsTruncated: false });
  await handler(cfnEvent('Delete', CODE_BUCKET_CLEANUP_RESOURCE_TYPE, { BucketName: 'new-bucket' }, 'old-bucket'));
  expect(s3.commandCalls(ListObjectVersionsCommand)[0].args[0].input.Bucket).toBe('old-bucket');
  expect(s3.commandCalls(DeleteObjectsCommand)).toHaveLength(0);
});

test('an untagged bucket is kept: the rollback of an update that added this resource to an existing bucket', async () => {
  for (const tags of [{ TagSet: [{ Key: 'other', Value: 'x' }] }, undefined]) {
    s3.reset();
    if (tags) s3.on(GetBucketTaggingCommand).resolves(tags);
    else s3.on(GetBucketTaggingCommand).rejects(Object.assign(new Error('no tags'), { name: 'NoSuchTagSet' }));

    const res = await handler(cfnEvent('Delete', CODE_BUCKET_CLEANUP_RESOURCE_TYPE, props, 'code-bucket'));

    expect(res).toEqual({ PhysicalResourceId: 'code-bucket' });
    expect(s3.commandCalls(ListObjectVersionsCommand)).toHaveLength(0);
    expect(s3.commandCalls(DeleteObjectsCommand)).toHaveLength(0);
  }
});

test('a bucket that is already gone is fine; failed deletions fail the delete', async () => {
  s3.reset();
  s3.on(GetBucketTaggingCommand).rejects(Object.assign(new Error('gone'), { name: 'NoSuchBucket' }));
  await expect(handler(cfnEvent('Delete', CODE_BUCKET_CLEANUP_RESOURCE_TYPE, props, 'code-bucket'))).resolves.toEqual({ PhysicalResourceId: 'code-bucket' });

  s3.reset();
  tagged();
  s3.on(ListObjectVersionsCommand).resolves({ Versions: [{ Key: 'k', VersionId: 'v' }], IsTruncated: false });
  s3.on(DeleteObjectsCommand).resolves({ Errors: [{ Key: 'k', Code: 'AccessDenied', Message: 'nope' }] });
  await expect(handler(cfnEvent('Delete', CODE_BUCKET_CLEANUP_RESOURCE_TYPE, props, 'code-bucket'))).rejects.toThrow('could not delete 1 object version(s) from code-bucket: AccessDenied nope');
});
