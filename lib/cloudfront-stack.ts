import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

type CloudFrontStackProps = cdk.StackProps & {
  restApi: cdk.aws_apigateway.RestApi;
  bucketAssets: cdk.aws_s3.Bucket;
  wafCloudFrontAclArn: string;
  wafRestApiOriginVerifyHeader: string;
  wafRestApiOriginVerifyHeaderValue: string;
};

export class CloudFrontStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
    super(scope, id, props);
    // ========================================
    //
    // CloudFront Distribution and Origins
    //
    // ========================================
    const apiOrigin = new cdk.aws_cloudfront_origins.HttpOrigin(
      `${props.restApi.restApiId}.execute-api.${cdk.Aws.REGION}.${cdk.Aws.URL_SUFFIX}`,
      {
        customHeaders: {
          [props.wafRestApiOriginVerifyHeader]:
            props.wafRestApiOriginVerifyHeaderValue,
        },
        originPath: `/${props.restApi.deploymentStage.stageName}`,
        originSslProtocols: [cdk.aws_cloudfront.OriginSslPolicy.TLS_V1_2],
        protocolPolicy: cdk.aws_cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      }
    );

    const cloudFrontDistribution = new cdk.aws_cloudfront.Distribution(
      this,
      "CloudFrontDistribution",
      {
        webAclId: props.wafCloudFrontAclArn,
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.S3Origin(props.bucketAssets),
          allowedMethods:
            cdk.aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy:
            cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        additionalBehaviors: {
          "api/*": {
            origin: apiOrigin,
            allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_DISABLED,
            viewerProtocolPolicy:
              cdk.aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          },
        },
      }
    );
  }
}
