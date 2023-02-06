import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class S3Stack extends cdk.Stack {
  bucketAssets: cdk.aws_s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    //
    // S3 Bucket for static assets and images
    //
    // ========================================
    const bucketAssets = new cdk.aws_s3.Bucket(this, "somebucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.bucketAssets = bucketAssets;
  }
}
