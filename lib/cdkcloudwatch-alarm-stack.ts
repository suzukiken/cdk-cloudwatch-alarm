import * as cdk from '@aws-cdk/core';
import * as sns from "@aws-cdk/aws-sns";
import * as ssm from "@aws-cdk/aws-ssm";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as cw_actions from '@aws-cdk/aws-cloudwatch-actions';
import * as subscriptions from "@aws-cdk/aws-sns-subscriptions";
import { PythonFunction } from "@aws-cdk/aws-lambda-python";

export class CdkcloudwatchAlarmStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const PREFIX_NAME = id.toLowerCase().replace("stack", "")
    const MAIL_ADDRESS = ssm.StringParameter.fromStringParameterName(this, "ssm_param_mail", "mail-address").stringValue;

    // the main function being monitored by cloudwatch
    
    const monitored_function = new PythonFunction(this, "monitored_function", {
      entry: "lambda",
      index: "monitored.py",
      handler: "lambda_handler",
      functionName: PREFIX_NAME + "-monitored",
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(3),
      reservedConcurrentExecutions: 1,
      maxEventAge: cdk.Duration.seconds(60),
    });
    
    // sns topic that cloudwatch alarm use when alarm happens
    
    const topic = new sns.Topic(this, "topic", {
      topicName: PREFIX_NAME + "-topic",
    });

    topic.addSubscription(new subscriptions.EmailSubscription(MAIL_ADDRESS));
    
    const alarm = new cloudwatch.Alarm(this, 'Alarm', {
      metric: monitored_function.metricThrottles(),
      period: cdk.Duration.minutes(1),
      threshold: 1,
      evaluationPeriods: 1,
      alarmName: PREFIX_NAME + "-alarm",
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    
    alarm.addAlarmAction(new cw_actions.SnsAction(topic));
    
    new cdk.CfnOutput(this, "output", { value: monitored_function.functionName })
  }
}



