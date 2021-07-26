const database = ({ name }) => {
    return {
        Resources: {
            Database: {
                Type: 'AWS::DynamoDB::Table',
                Properties: {
                    TableName: name,
                    AttributeDefinitions: [
                        {
                            AttributeName: 'pk',
                            AttributeType: 'S'
                        },
                        {
                            AttributeName: 'sk',
                            AttributeType: 'S'
                        },
                        {
                            AttributeName: 'pk2',
                            AttributeType: 'S'
                        },
                        {
                            AttributeName: 'pk3',
                            AttributeType: 'S'
                        }
                    ],
                    KeySchema: [
                        {
                            AttributeName: 'pk',
                            KeyType: 'HASH'
                        },
                        {
                            AttributeName: 'sk',
                            KeyType: 'RANGE'
                        }
                    ],
                    GlobalSecondaryIndexes: [
                        {
                            IndexName: 'pk2',
                            KeySchema: [
                                {
                                    AttributeName: 'pk2',
                                    KeyType: 'HASH'
                                },
                                {
                                    AttributeName: 'sk',
                                    KeyType: 'RANGE'
                                }
                            ],
                            Projection: {
                                ProjectionType: 'ALL'
                            }
                        },
                        {
                            IndexName: 'pk3',
                            KeySchema: [
                                {
                                    AttributeName: 'pk3',
                                    KeyType: 'HASH'
                                },
                                {
                                    AttributeName: 'sk',
                                    KeyType: 'RANGE'
                                }
                            ],
                            Projection: {
                                ProjectionType: 'ALL'
                            }
                        }
                    ],
                    BillingMode: 'PAY_PER_REQUEST'
                }
            }
        },
        Outputs: {}
    }
}

const cognito = ({ active, name }) => {
    if (!active) {
        return {
            Resources: {},
            Outputs: {}
        }
    }
    return {
        Resources: {
            CognitoUserPoolMyUserPool: {
                Type: 'AWS::Cognito::UserPool',
                Properties: {
                    UserPoolName: name + '-user-pool',
                    UsernameAttributes: ['email'],
                    AutoVerifiedAttributes: ['email'],
                    AdminCreateUserConfig: {
                        AllowAdminCreateUserOnly: true,
                        InviteMessageTemplate: {
                            EmailSubject: 'You are being invited to join'
                        },
                        UnusedAccountValidityDays: 365
                    }
                }
            },
            CognitoUserPoolClient: {
                Type: 'AWS::Cognito::UserPoolClient',
                Properties: {
                    ClientName: name + '-user-pool-client',
                    UserPoolId: {
                        Ref: 'CognitoUserPoolMyUserPool'
                    },
                    ExplicitAuthFlows: ['ADMIN_NO_SRP_AUTH'],
                    GenerateSecret: false
                }
            }
        },
        Outputs: {
            UserPoolId: {
                Value: {
                    Ref: 'CognitoUserPoolMyUserPool'
                }
            },
            UserPoolClientId: {
                Value: {
                    Ref: 'CognitoUserPoolClient'
                }
            }
        }
    }
}

const graphQL = ({ name, auth = false, region }) => {
    const apiWithCognito = {
        Name: name,
        XrayEnabled: false,
        AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
        UserPoolConfig: {
            AwsRegion: region,
            UserPoolId: {
                Ref: 'CognitoUserPoolMyUserPool'
            },
            DefaultAction: 'ALLOW'
        },

        AdditionalAuthenticationProviders: [
            {
                AuthenticationType: 'API_KEY'
            },
            {
                AuthenticationType: 'AWS_IAM'
            }
        ]
    }

    const apiWithoutCognito = {
        Name: name,
        XrayEnabled: false,
        AuthenticationType: 'API_KEY',
        AdditionalAuthenticationProviders: [
            {
                AuthenticationType: 'AWS_IAM'
            }
        ]
    }

    const authActivated = auth && typeof auth === 'boolean'

    return {
        Resources: {
            GraphQlApi: {
                Type: 'AWS::AppSync::GraphQLApi',
                Properties: authActivated ? apiWithCognito : apiWithoutCognito
            }
        },
        Outputs: {
            ApiUrl: {
                Description: 'URL',
                Value: {
                    'Fn::GetAtt': ['GraphQlApi', 'GraphQLUrl']
                }
            },
            AppsyncId: {
                Description: 'AppsyncId',
                Value: {
                    Ref: 'GraphQlApi'
                }
            }
        }
    }
}

const schema = ({ schema }) => {
    return {
        Resources: {
            GraphQlSchema: {
                Type: 'AWS::AppSync::GraphQLSchema',
                Properties: {
                    Definition: schema,
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    }
                }
            }
        },
        Outputs: {}
    }
}

const apiKey = () => {
    return {
        Resources: {
            GraphQlApiKeyDefault: {
                Type: 'AWS::AppSync::ApiKey',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Expires: 1627859769
                }
            }
        },
        Outputs: {
            ApiKey: {
                Description: 'ApiKey',
                Value: {
                    'Fn::GetAtt': ['GraphQlApiKeyDefault', 'ApiKey']
                }
            }
        }
    }
}

const datasource = ({ dbName, region, apiName }) => {
    return {
        Resources: {
            DbDatasource: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: 'DbDatasource',
                    Type: 'AMAZON_DYNAMODB',
                    DynamoDBConfig: {
                        TableName: dbName,
                        AwsRegion: region
                    },
                    ServiceRoleArn: {
                        'Fn::GetAtt': ['DbDatasourceRole', 'Arn']
                    }
                }
            },
            DbDatasourceRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: `${apiName}-dynamodb-policy`,
                    AssumeRolePolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: ['sts:AssumeRole'],
                                Principal: {
                                    Service: ['appsync.amazonaws.com']
                                }
                            }
                        ]
                    },

                    Policies: [
                        {
                            PolicyName: `${apiName}PolicyDynamoDB`,
                            PolicyDocument: {
                                Version: '2012-10-17',

                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['dynamodb:*'],
                                        Resource: [
                                            {
                                                'Fn::Sub': [
                                                    'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/' +
                                                        dbName,
                                                    {}
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        },
        Outputs: {}
    }
}

const datasourceEventBridge = ({ eventBus, region, apiName }) => {
    return {
        Resources: {
            EventBridgeDataSource: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: 'EventBridgeDataSource',
                    Type: 'HTTP',
                    HttpConfig: {
                        AuthorizationConfig: {
                            AuthorizationType: 'AWS_IAM',
                            AwsIamConfig: {
                                SigningRegion: region,
                                SigningServiceName: 'events'
                            }
                        },
                        Endpoint: 'https://events.' + region + '.amazonaws.com/'
                    },
                    ServiceRoleArn: {
                        'Fn::GetAtt': ['EventDatasourceRole', 'Arn']
                    }
                }
            },
            EventDatasourceRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: `${apiName}-eventds-policy`,
                    AssumeRolePolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: ['sts:AssumeRole'],
                                Principal: {
                                    Service: ['appsync.amazonaws.com']
                                }
                            }
                        ]
                    },

                    Policies: [
                        {
                            PolicyName: `${apiName}PolicyEventDS`,
                            PolicyDocument: {
                                Version: '2012-10-17',

                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['events:Put*'],
                                        Resource: [
                                            {
                                                'Fn::Sub': [
                                                    'arn:aws:events:${AWS::Region}:${AWS::AccountId}:event-bus/' +
                                                        eventBus,
                                                    {}
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        },
        Outputs: {}
    }
}

/* 
    ProductUpdatedEventRule:
        Type: AWS::Events::Rule
        Properties:
            Description: Listen on the custom event bus for events
            EventBusName: !ImportValue AppsyncCoffeeshopEventBusName
            EventPattern:
                source:
                    - custom.AppsyncCoffeeshopAdmin
                detail-type:
                    - product-updated
            Targets:
                - Arn: !Ref ProductUpdatedWorkflow
                  Id: ProductUpdatedWorkflow
                  RoleArn: !GetAtt InvokeWorkflowRole.Arn

*/

const eventBridgeTrigger = ({ apiName }) => {
    const code = `
const env = require("process").env;
const AWS = require("aws-sdk");
const URL = require("url");
const https = require('https');

AWS.config.update({
  region: process.env.REGION,
  credentials: new AWS.Credentials(
    env.AWS_ACCESS_KEY_ID,
    env.AWS_SECRET_ACCESS_KEY,
    env.AWS_SESSION_TOKEN
  ),
});

module.exports.handler = (props) => {
    const input = JSON.parse(props)
    const body = {
        query: input.query.split(\`'\`).join(\`"\`),
        variables: {
            input: input.input
        }
    }
    const uri = URL.parse(process.env.ENDPOINT);
    const httpRequest = new AWS.HttpRequest(uri.href, process.env.REGION);
    httpRequest.headers.host = uri.host;
    httpRequest.headers["Content-Type"] = "application/json";
    httpRequest.method = "POST";
    httpRequest.body = JSON.stringify(body);

    const signer = new AWS.Signers.V4(httpRequest, "appsync", true);
    signer.addAuthorization(AWS.config.credentials, AWS.util.date.getDate());

    const options = {
        hostname: uri.href.slice(8, uri.href.length - 8),
        path: '/graphql',
        method: httpRequest.method,
        body: httpRequest.body,
        headers: httpRequest.headers,
    };

    const req = https.request(options, res => {

    res.on('data', d => {
            process.stdout.write(d)
        })
    })

    req.on('error', error => {
        console.error(error.message)
    })

    req.write(JSON.stringify(body))
    req.end()
}`

    return {
        Resources: {
            TriggerSubscriptionFunction: {
                Type: 'AWS::Lambda::Function',
                Properties: {
                    Runtime: 'nodejs12.x',
                    Handler: 'index.handler',
                    Role: {
                        'Fn::GetAtt': ['TriggerSubscriptionRole', 'Arn']
                    },
                    Code: {
                        ZipFile: code
                    },
                    Environment: {
                        Variables: {
                            REGION: {
                                'Fn::Sub': ['${AWS::Region}', {}]
                            },
                            ENDPOINT: {
                                'Fn::GetAtt': ['GraphQlApi', 'GraphQLUrl']
                            }
                        }
                    }
                }
            },
            TriggerSubscriptionRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: `TriggerSubscriptionRole${apiName}`,
                    AssumeRolePolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: ['sts:AssumeRole'],
                                Principal: {
                                    Service: ['lambda.amazonaws.com']
                                }
                            }
                        ]
                    },

                    Policies: [
                        {
                            PolicyName: `TriggerSubscriptionPolicy${apiName}`,
                            PolicyDocument: {
                                Version: '2012-10-17',

                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: ['appsync:GraphQL'],
                                        Resource: [
                                            {
                                                'Fn::Join': [
                                                    '',
                                                    [
                                                        {
                                                            'Fn::GetAtt': [
                                                                'GraphQlApi',
                                                                'Arn'
                                                            ]
                                                        },
                                                        '/types/*'
                                                    ]
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        },
        Outputs: {}
    }
}

module.exports = (rise) => {
    const ql = graphQL({
        name: rise.config.name,
        auth: rise.config.auth || false,
        region: rise.config.region || 'us-east-1'
    })

    const sc = schema({
        schema: rise.schema //.replace(/  /g, '').replace(/(\r\n|\n|\r)/gm, '')
    })

    const ak = apiKey()
    const ds = datasource({
        apiName: rise.config.name,
        dbName: rise.config.name,
        region: rise.config.region || 'us-east-1'
    })
    const db = database({ name: rise.config.name })

    const cog = cognito({
        active: rise.config.auth || false,
        name: rise.config.name
    })

    const eventDs = rise.config.eventBus
        ? datasourceEventBridge({
              eventBus: rise.config.eventBus,
              region: rise.config.region || 'us-east-1',
              apiName: rise.config.name
          })
        : {
              Resources: {},
              Outputs: {}
          }

    const triggerFunction = eventBridgeTrigger({
        apiName: rise.config.name
    })

    return {
        Resources: {
            ...ql.Resources,
            ...sc.Resources,
            ...ak.Resources,
            ...ds.Resources,
            ...db.Resources,
            ...eventDs.Resources,
            ...cog.Resources

            //...triggerFunction.Resources
        },
        Outputs: {
            ...ql.Outputs,
            ...sc.Outputs,
            ...ak.Outputs,
            ...ds.Outputs,
            ...db.Outputs,
            ...eventDs.Outputs,
            ...cog.Outputs
            //...triggerFunction.Outputs
        }
    }
}
