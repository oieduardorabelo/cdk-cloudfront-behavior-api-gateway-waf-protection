import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class RestApiStack extends cdk.Stack {
  restApi: cdk.aws_apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    //
    // AWS Lambda functions
    //
    // ========================================
    const meLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "meLambda",
      {
        entry: "handlers/me.ts",
      }
    );
    const proxyLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "proxyLambda",
      {
        entry: "handlers/proxy.ts",
      }
    );

    // ========================================
    //
    // REST API in Amazon API Gateway
    //
    // ========================================
    const restApi = new cdk.aws_apigateway.RestApi(this, "someapi", {
      endpointConfiguration: {
        types: [cdk.aws_apigateway.EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
      },
    });
    restApi.root.addProxy({
      anyMethod: true,
      defaultIntegration: new cdk.aws_apigateway.LambdaIntegration(proxyLambda),
    });
    restApi.root
      .addResource("me")
      .addMethod("GET", new cdk.aws_apigateway.LambdaIntegration(meLambda));

    this.restApi = restApi;
  }
}
