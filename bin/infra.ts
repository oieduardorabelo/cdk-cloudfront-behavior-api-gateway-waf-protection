#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { S3Stack } from "../lib/s3-stack";
import { RestApiStack } from "../lib/rest-api-stack";
import { WafStack } from "../lib/waf-stack";
import { CloudFrontStack } from "../lib/cloudfront-stack";

const app = new cdk.App();
const s3Stack = new S3Stack(app, "S3Stack");
const restApiStack = new RestApiStack(app, "RestApiStack");
const wafStack = new WafStack(app, "WafStack", {
  restApi: restApiStack.restApi,
});
const cloudFrontStack = new CloudFrontStack(app, "CloudFrontStack", {
  bucketAssets: s3Stack.bucketAssets,
  restApi: restApiStack.restApi,
  wafCloudFrontAclArn: wafStack.wafCloudFrontAclArn,
  wafRestApiOriginVerifyHeader: wafStack.wafRestApiOriginVerifyHeader,
  wafRestApiOriginVerifyHeaderValue: wafStack.wafRestApiOriginVerifyHeaderValue,
});
