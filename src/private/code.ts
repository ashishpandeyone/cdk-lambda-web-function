import { CustomResource, Stack } from 'aws-cdk-lib';
import type * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { codeBucket } from './code-bucket';
import { grantToProvider, webFunctionProvider } from './provider';
import { CODE_RESOURCE_TYPE, type CodeProperties } from './provider-protocol';

/** Where a revision's code lives after it has been copied into the stack's code bucket. */
export interface CodeLocation {
  readonly bucketName: string;
  readonly objectKey: string;
  readonly objectVersion: string;
}

/**
 * Binds a `lambda.Code` and copies the zip it produces into the stack's code bucket.
 * Inline code and container images are rejected: Web Functions run zips from S3 only.
 */
export class WebFunctionCode extends Construct {
  public readonly location: CodeLocation;

  constructor(scope: Construct, id: string, code: lambda.Code) {
    super(scope, id);

    const config = code.bind(this);
    if (config.inlineCode !== undefined) {
      throw new Error(`${this.node.path}: Lambda Web Functions do not support inline code (Code.fromInline); use Code.fromAsset or Code.fromBucket`);
    }
    if (config.image !== undefined) {
      throw new Error(`${this.node.path}: Lambda Web Functions do not support container images; use a zip (Code.fromAsset or Code.fromBucket)`);
    }
    if (!config.s3Location) {
      throw new Error(`${this.node.path}: The code did not produce an S3 location`);
    }

    const source = config.s3Location;
    const bucket = codeBucket(this);
    const destinationKey = `web-functions/${this.node.addr}/${source.objectKey}`;

    const provider = webFunctionProvider(this);
    // Stable grants (see grantToProvider): any object of the source bucket, and the code prefix of ours.
    const sourceObjectsArn = Stack.of(this).formatArn({ service: 's3', region: '', account: '', resource: source.bucketName, resourceName: '*' });
    grantToProvider(provider, { Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:GetObjectTagging', 's3:GetObjectVersionTagging'], Resource: sourceObjectsArn });
    grantToProvider(provider, { Action: ['s3:GetObject', 's3:PutObject', 's3:PutObjectTagging'], Resource: bucket.arnForObjects('web-functions/*') });
    // Without ListBucket, S3 answers HeadObject on a missing key with 403 instead of 404.
    grantToProvider(provider, { Action: 's3:ListBucket', Resource: bucket.bucketArn });

    const properties: CodeProperties = {
      SourceBucket: source.bucketName,
      SourceKey: source.objectKey,
      SourceVersion: source.objectVersion,
      DestinationBucket: bucket.bucketName,
      DestinationKey: destinationKey,
    };
    const copy = new CustomResource(this, 'Copy', {
      serviceToken: provider.serviceToken,
      resourceType: CODE_RESOURCE_TYPE,
      properties: { ...properties },
    });
    copy.node.addDependency(bucket);

    this.location = {
      bucketName: bucket.bucketName,
      objectKey: destinationKey,
      objectVersion: copy.getAttString('VersionId'),
    };
  }
}
