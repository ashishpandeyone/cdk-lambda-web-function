import { Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

const ID = 'LambdaWebFunctionCodeBucket';

/**
 * The stack's code bucket (one per stack).
 *
 * Lambda Web Functions download code as the `lambda.amazonaws.com` service principal and
 * reject unversioned buckets; the CDK bootstrap bucket allows neither, so code is copied here.
 * Revisions capture their code when they're created, so superseded versions can expire, but
 * current objects must stay: a later revision may be created from the same object.
 */
export function codeBucket(scope: Construct): s3.Bucket {
  const stack = Stack.of(scope);
  const existing = stack.node.tryFindChild(ID) as s3.Bucket | undefined;
  if (existing) return existing;

  const bucket = new s3.Bucket(stack, ID, {
    versioned: true,
    enforceSSL: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    encryption: s3.BucketEncryption.S3_MANAGED,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    lifecycleRules: [{
      id: 'ExpireSupersededCode',
      noncurrentVersionExpiration: Duration.days(30),
      abortIncompleteMultipartUploadAfter: Duration.days(1),
    }],
  });
  bucket.addToResourcePolicy(new iam.PolicyStatement({
    sid: 'LambdaWebFunctionsReadCode',
    principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
    actions: ['s3:GetObject', 's3:GetObjectVersion'],
    resources: [bucket.arnForObjects('*')],
    conditions: { StringEquals: { 'aws:SourceAccount': stack.account } },
  }));
  return bucket;
}
