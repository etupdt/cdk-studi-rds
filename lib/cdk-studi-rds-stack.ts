import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

export class CdkStudiRdsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    console.log('stack availabilityZones ====>', this.availabilityZones)
    console.log(cdk.Stack.of(this).availabilityZones.sort().slice(0,1))

    const vpc = new ec2.Vpc(this, 'studi-vpc', {
      enableDnsHostnames: true,
      enableDnsSupport: true,
      ipAddresses: ec2.IpAddresses.cidr("172.30.0.0/16"),    
      availabilityZones: ['eu-west-3a', 'eu-west-3b'],
    })

    const securityGroupEc2 = new ec2.SecurityGroup(this, 'studi-ec2-security-group-cdk', {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'regles des container crees par cdk dans studi-vpc',
      securityGroupName: 'studi-ec2-security-group-cdk'
    });

    const securityGroupEc2Rds = new ec2.SecurityGroup(this, 'studi-ec2-rds-security-group-cdk', {
      vpc: vpc,
      allowAllOutbound: false,
      description: 'regles des container crees par cdk dans studi-vpc',
      securityGroupName: 'studi-ec2-rds-security-group-cdk'
    });

    const securityGroupRds = new ec2.SecurityGroup(this, 'studi-rds-security-group-cdk', {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'regles de la bdd mariadb dans studi-vpc',
      securityGroupName: 'studi-rds-security-group-cdk'
    });

    const securityGroupRdsEc2 = new ec2.SecurityGroup(this, 'studi-rds-ec2-security-group-cdk', {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'regles de la bdd mariadb dans studi-vpc',
      securityGroupName: 'studi-rds-ec2-security-group-cdk'
    });

    securityGroupEc2Rds.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3306), 'open for access Ec2 to mariadb')
    securityGroupRdsEc2.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3306), 'open for access mariadb from Ec2')

    const database = new rds.DatabaseInstance(this, 'studi-mariadb-cdk', {
      vpc: vpc,
      securityGroups: [
        securityGroupRds,
        securityGroupRdsEc2
      ],
      availabilityZone: 'eu-west-3a',
      credentials: rds.Credentials.fromPassword('admin', cdk.SecretValue.unsafePlainText('password')),
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
      engine: rds.DatabaseInstanceEngine.mariaDb({
        version: rds.MariaDbEngineVersion.VER_10_5
      })
    })

  }
}
