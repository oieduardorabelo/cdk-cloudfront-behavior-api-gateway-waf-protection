import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

const WAF_REST_API_ORIGIN_VERIFY_HEADER = "X-Origin-Verify";
const WAF_REST_API_ORIGIN_VERIFY_HEADER_VALUE = "protect-my-api";

type WafStackProps = cdk.StackProps & {
  restApi: cdk.aws_apigateway.RestApi;
};

export class WafStack extends cdk.Stack {
  wafCloudFrontAclArn: string;
  wafRestApiOriginVerifyHeader: string;
  wafRestApiOriginVerifyHeaderValue: string;

  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    this.wafRestApiOriginVerifyHeader = WAF_REST_API_ORIGIN_VERIFY_HEADER;
    this.wafRestApiOriginVerifyHeaderValue =
      WAF_REST_API_ORIGIN_VERIFY_HEADER_VALUE;

    // ========================================
    //
    // WAF v2 WebACL and Associations
    //
    // ========================================

    //
    // ACL to prevent API Gateway or AWS CloudFront from SQL injection attacks
    // We are not using 'AWS::WAFv2::WebACLAssociation'.
    // Instead, we use CloudFront distribution configuration.
    //
    const wafCloudFrontAcl = new cdk.aws_wafv2.CfnWebACL(
      this,
      "wafCloudFrontAcl",
      {
        scope: "CLOUDFRONT",
        defaultAction: {
          allow: {},
        },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: "wafCloudFrontAclArn-metric",
        },
      }
    );
    this.wafCloudFrontAclArn = wafCloudFrontAcl.attrArn;

    //
    // Create WAF to evaluate Origin Custom Header
    // This will be associated with API Gateway
    //
    const wafRestApi = new cdk.aws_wafv2.CfnWebACL(this, "wafRestApi", {
      scope: "REGIONAL",
      defaultAction: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: "wafRestApi-metric",
      },
      rules: [
        {
          name: "wafRestApi-verifyHeader-rule",
          priority: 0,
          action: {
            allow: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: "wafRestApi-verifyHeader-rule-metric",
          },
          statement: {
            byteMatchStatement: {
              fieldToMatch: {
                singleHeader: {
                  Name: WAF_REST_API_ORIGIN_VERIFY_HEADER,
                },
              },
              positionalConstraint: "EXACTLY",
              searchString: WAF_REST_API_ORIGIN_VERIFY_HEADER_VALUE,
              textTransformations: [{ priority: 0, type: "NONE" }],
            },
          },
        },
      ],
    });
    const wafRestApiAssociation = new cdk.aws_wafv2.CfnWebACLAssociation(
      this,
      "wafRestApiAssociation",
      {
        webAclArn: wafRestApi.attrArn,
        resourceArn: `arn:aws:apigateway:${cdk.Aws.REGION}::/restapis/${props.restApi.restApiId}/stages/${props.restApi.deploymentStage.stageName}`,
      }
    );
  }
}
