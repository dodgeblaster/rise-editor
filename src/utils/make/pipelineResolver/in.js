// FUNCTIONS

const makeGet = () => {
    return {
        Resources: {
            FunctionGet: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: 'functionGet',
                    RequestMappingTemplate: `
                {
                  "version": "2017-02-28",
                  "operation": "GetItem",
                  "key": {
                     "pk" : $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                     "sk" : $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                  },
                }`,

                    ResponseMappingTemplate: `
                        $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        }
    }
}

const makeGuard = (props) => {
    const path = props.path || '$ctx.args.input.'
    const cogPath = '$ctx.identity.claims.'
    let pk = props.config.pk || ''
    if (props.config.pk?.startsWith('$')) {
        pk = pk.replace('$', path)
    } else if (props.config.pk?.startsWith('!')) {
        pk = pk.replace('!', cogPath)
    } else {
        pk = `"${pk}"`
    }

    let sk = props.config.sk
    if (props.config.sk?.startsWith('$')) {
        sk = sk.replace('$', path)
    } else if (props.config.sk?.startsWith('!')) {
        sk = sk.replace('!', cogPath)
    } else {
        sk = `"${sk}"`
    }
    return {
        Resources: {
            [`FunctionGaurd${props.field}${props.index}`]: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: `FunctionGaurd${props.field}${props.index}`,
                    RequestMappingTemplate: `
                {
                  "version": "2017-02-28",
                  "operation": "GetItem",
                  "key": {
                     "pk" : $util.dynamodb.toDynamoDBJson(${pk}),
                     "sk" : $util.dynamodb.toDynamoDBJson(${sk})
                  },
                }`,

                    ResponseMappingTemplate: `
                    #if(!$ctx.result)
                        $util.error("Unauthorized")
                    #else
                        $util.toJson($ctx.result)
                    #end    
                `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        }
    }
}

const makeQuery = () => {
    return {
        Resources: {
            FunctionQuery: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: 'functionQuery',
                    RequestMappingTemplate: `
                {
                  "version": "2017-02-28",
                  "operation" : "Query",
                    "query" : {
                        "expression" : "pk = :pk AND begins_with(sk, :sk)",
                        "expressionValues" : {
                            ":pk" : $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                            ":sk" : $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                        }
                    }
                }`,

                    ResponseMappingTemplate: `
                    $util.qr($ctx.stash.put("dbresult", $ctx.result.items))
                    $util.toJson($ctx.result.items)
                `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        }
    }
}

const makeCreate = () => {
    return {
        Resources: {
            FunctionCreate: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: 'functionCreate',
                    RequestMappingTemplate: `
                    {
                        "version": "2017-02-28",
                        "operation": "PutItem",
                        "key": {
                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                        },
                        "attributeValues": $util.dynamodb.toMapValuesJson($context.stash.input)
                    }`,

                    ResponseMappingTemplate: `
                        $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        }
    }
}

const makeRemove = () => {
    return {
        Resources: {
            FunctionRemove: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'DbDatasource',
                    FunctionVersion: '2018-05-29',
                    Name: 'functionRemove',
                    RequestMappingTemplate: `
                    {
                        "version": "2017-02-28",
                        "operation": "DeleteItem",
                        "key": {
                            "pk": $util.dynamodb.toDynamoDBJson($context.stash.input.pk),
                            "sk": $util.dynamodb.toDynamoDBJson($context.stash.input.sk)
                        }
                    }`,

                    ResponseMappingTemplate: `
                       $util.qr($ctx.stash.put("dbresult", $ctx.result))
                        $util.toJson($ctx.result)
                    `
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        }
    }
}

// first have to make eventbridge datastore
const makeEmitEvent = (props) => {
    let detail = `"{`
    Object.keys(props.config.detail).forEach((x, i, array) => {
        let value = props.config.detail[x]

        if (value.startsWith('$')) {
            value = value.replace('$', '$ctx.args.input.')
        }

        if (value.startsWith('!')) {
            value = value.replace('!', '$ctx.identity.claims.')
        }

        if (value.startsWith('#')) {
            value = value.replace('#', '$ctx.stash.dbresult.')
        }

        detail = detail + `\\\"${x}\\\": \\\"${value}\\\"` // eslint-disable-line

        if (i + 1 < array.length) {
            detail = detail + ','
        }
    })
    detail = detail + `}"`

    return {
        Resources: {
            [`FunctionEmit${props.name}`]: {
                Type: 'AWS::AppSync::FunctionConfiguration',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    DataSourceName: 'EventBridgeDataSource',
                    FunctionVersion: '2018-05-29',
                    Name: `FunctionEmit${props.name}`,
                    RequestMappingTemplate: `
                    {
                        "version": "2018-05-29",
                        "method": "POST",
                        "resourcePath": "/",
                        "params": {
                        "headers": {
                            "content-type": "application/x-amz-json-1.1",
                            "x-amz-target":"AWSEvents.PutEvents"
                        },
                        "body": {
                            "Entries":[ 
                                    {
                                        "Source":"custom.${props.config.source}",
                                        "EventBusName": "${props.config.eventBus}",
                                        "Detail": ${detail},
                                        "DetailType":"${props.config.event}"
                                    }
                                ]
                            }
                        }
                    }`,
                    ResponseMappingTemplate: `
                    #if($ctx.error)
                        $util.error($ctx.error.message, $ctx.error.type)
                    #end
   
                    #if($ctx.result.statusCode == 200)
                        $util.qr($ctx.stash.put("eventresult", $ctx.result.body))
                        ## If response is 200, return the body.
                        {
                            "result": "$util.parseJson($ctx.result.body)"
                        }    
                    #else
                        $utils.appendError($ctx.result.body, $ctx.result.statusCode)
                    #end`
                },
                DependsOn: ['EventBridgeDataSource', 'GraphQlSchema']
            }
        }
    }
}

// PIPELINES
const makeQueryPipeline = (props) => {
    let requestTemplate = `
            #if($util.isNullOrEmpty($ctx.args.input))
                $util.qr($ctx.stash.put("input", {}))	
            #else
                $util.qr($ctx.stash.put("input", $ctx.args.input))
            #end
    `
    Object.keys(props.config).forEach((k) => {
        let value = props.config[k]

        if (value.startsWith('$')) {
            value = value.replace('$', '$ctx.args.input.')
        } else if (value.startsWith('!')) {
            value = value.replace('!', '$ctx.identity.claims.')
        } else {
            value = `"${value}"`
        }

        if (value.includes('@id')) {
            requestTemplate =
                requestTemplate +
                `           $util.qr($ctx.stash.input.put("${k}", $util.str.toReplace(${value}, "@id", $util.autoId()))) `
        } else {
            requestTemplate =
                requestTemplate +
                `           $util.qr($ctx.stash.input.put("${k}", ${value})) `
        }
    })
    requestTemplate = requestTemplate + `\n             {}`

    return {
        Resources: {
            [`PipelineQuery${props.field}`]: {
                Type: 'AWS::AppSync::Resolver',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    FieldName: props.field,
                    Kind: 'PIPELINE',
                    PipelineConfig: {
                        Functions: props.functions.map((x) => ({
                            'Fn::GetAtt': [x, 'FunctionId']
                        }))
                    },
                    RequestMappingTemplate: requestTemplate,
                    ResponseMappingTemplate: `
            #if($ctx.stash.dbresult)
                $util.toJson($ctx.stash.dbresult)
                
            #else
                $util.error("event branch")
                $ctx.stash.eventresult
            #end
                `,
                    TypeName: 'Query'
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}

const makeMutationPipeline = (props) => {
    let requestTemplate = `
            #if($util.isNullOrEmpty($ctx.args.input))
                $util.qr($ctx.stash.put("input", {}))	
            #else
                $util.qr($ctx.stash.put("input", $ctx.args.input))
            #end
    `
    Object.keys(props.config).forEach((k) => {
        let value = props.config[k]

        if (value.startsWith('$')) {
            value = value.replace('$', '$ctx.args.input.')
        } else if (value.startsWith('!')) {
            value = value.replace('!', '$ctx.identity.claims.')
        } else {
            value = `"${value}"`
        }

        if (value.includes('@id')) {
            requestTemplate =
                requestTemplate +
                `           $util.qr($ctx.stash.input.put("${k}", $util.str.toReplace(${value}, "@id", $util.autoId()))) `
        } else {
            requestTemplate =
                requestTemplate +
                `           $util.qr($ctx.stash.input.put("${k}", ${value})) `
        }
    })

    requestTemplate = requestTemplate + `\n             {}`
    return {
        Resources: {
            [`PipelineMutation${props.field}`]: {
                Type: 'AWS::AppSync::Resolver',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    FieldName: props.field,
                    Kind: 'PIPELINE',
                    PipelineConfig: {
                        Functions: props.functions.map((x) => ({
                            'Fn::GetAtt': [x, 'FunctionId']
                        }))
                    },
                    RequestMappingTemplate: requestTemplate,
                    ResponseMappingTemplate: `
                #if($ctx.stash.dbresult)
                  $util.toJson($ctx.stash.dbresult)   
                #else
                    $util.toJson($ctx.args)
                    ## $ctx.stash.eventresult
                #end
                `,
                    TypeName: 'Mutation'
                },
                DependsOn: ['DbDatasource', 'GraphQlSchema']
            }
        },
        Outputs: {}
    }
}

const eventBridgeTrigger = ({
    apiName,
    eventName,
    index,
    query,
    eventInput
}) => {
    let v = '{'
    Object.keys(eventInput).forEach((k, i) => {
        v = v + `${k}: props.${eventInput[k]}`
        if (Object.keys(eventInput).length > i + 1) {
            v = v + ','
        }
    })

    v = v + '}'

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
                //const input = JSON.parse(props)
                const body = {
                    query: \`${query}\`,
                    variables: {
                        input: ${v}
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
            [`TriggerSubscriptionFunction${apiName}${eventName}${index}`]: {
                Type: 'AWS::Lambda::Function',
                Properties: {
                    Runtime: 'nodejs12.x',
                    Handler: 'index.handler',
                    Role: {
                        'Fn::GetAtt': [
                            `TriggerSubscriptionRole${apiName}${eventName}${index}`,
                            'Arn'
                        ]
                    },
                    Code: {
                        ZipFile: code
                    },
                    Environment: {
                        Variables: {
                            REGION: {
                                'Fn::Sub': ['${AWS::Region}', {}] // eslint-disable-line
                            },
                            ENDPOINT: {
                                'Fn::GetAtt': ['GraphQlApi', 'GraphQLUrl']
                            }
                        }
                    }
                }
            },
            [`TriggerSubscriptionRole${apiName}${eventName}${index}`]: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    RoleName: `TriggerSubscriptionRole${apiName}${eventName}${index}`,
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

const makeEventRule = ({
    apiName,
    eventBus,
    eventSource,
    eventName,
    index
}) => {
    //const temp2 = '"{ \\"input\\": \\"<input>\\" }"'

    // let temp = '"{ \\"input\\":  {'
    // Object.keys(eventInput).forEach((k, i) => {
    //     const key = k
    //     const value = eventInput[k]
    //     temp = temp + '\\"' + key + '\\": \\"<' + key + '>\\"'

    //     if (Object.keys(eventInput).length > i + 1) {
    //         temp = temp + ','
    //     }
    // })
    // temp = temp + '}}"'

    // const temp2 =
    //     '"{ \\"input\\":  { \\"event\\": \\"<event>\\",\\"sk\\": \\"<sk>\\",\\"pk\\": \\"<pk>\\" }}"'

    return {
        Resources: {
            [`EventListener${apiName}${eventName}${index}`]: {
                Type: 'AWS::Events::Rule',
                Properties: {
                    EventBusName: eventBus,
                    EventPattern: {
                        source: [`custom.${eventSource}`],
                        'detail-type': [eventName]
                    },
                    Targets: [
                        {
                            Arn: {
                                'Fn::GetAtt': [
                                    `TriggerSubscriptionFunction${apiName}${eventName}${index}`,
                                    'Arn'
                                ]
                            },
                            Id: `EventListener${apiName}${eventName}${index}`
                            // RoleArn: {
                            //     'Fn::GetAtt': [
                            //         `EventRuleRole${apiName}${eventName}role`,
                            //         'Arn'
                            //     ]
                            // },
                            // InputTransformer: {
                            //     InputPathsMap: eventInput,
                            //     // {
                            //     //     pk: '$.detail.pk',
                            //     //     sk: '$.detail.sk',
                            //     //     event: '$.detail.event'
                            //     // },

                            //     //eventInput,

                            //     InputTemplate: temp
                            //     //'"{ \\"event\\": \\"<event>\\",\\"sk\\": \\"<sk>\\",\\"pk\\": \\"<pk>\\" }"'
                            //     //temp2
                            // }
                        }
                    ]
                }
                //DependsOn: `TriggerSubscriptionFunction${apiName}${eventName}${index}`
            },

            /* 
            
            EventBridgeLambdaPermission:
            Type: AWS::Lambda::Permission
            Properties:
                FunctionName: !GetAtt function.Arn
                Action: lambda:InvokeFunction
                Principal: events.amazonaws.com
                SourceArn: !GetAtt EventRuleNewCustomer.Arn
            */

            [`EventRuleRole${apiName}${eventName}${index}`]: {
                Type: 'AWS::Lambda::Permission',
                Properties: {
                    FunctionName: {
                        'Fn::GetAtt': [
                            `TriggerSubscriptionFunction${apiName}${eventName}${index}`,
                            'Arn'
                        ]
                    },
                    Action: 'lambda:InvokeFunction',
                    Principal: 'events.amazonaws.com',
                    SourceArn: {
                        'Fn::GetAtt': [
                            `EventListener${apiName}${eventName}${index}`,
                            'Arn'
                        ]
                    }
                }
                // Properties: {
                //     RoleName: `EventRuleRole${apiName}${eventName}role`,
                //     AssumeRolePolicyDocument: {
                //         Version: '2012-10-17',
                //         Statement: [
                //             {
                //                 Effect: 'Allow',
                //                 Action: ['sts:AssumeRole'],
                //                 Principal: {
                //                     Service: ['events.amazonaws.com']
                //                 }
                //             }
                //         ]
                //     },

                //     Policies: [
                //         {
                //             PolicyName: `EventRuleRole${apiName}${eventName}policy`,
                //             PolicyDocument: {
                //                 Version: '2012-10-17',

                //                 Statement: [
                //                     {
                //                         Effect: 'Allow',
                //                         Action: ['lambda:InvokeFunction'],
                //                         Resource: [
                //                             {
                //                                 'Fn::GetAtt': [
                //                                     'TriggerSubscriptionFunction',
                //                                     'Arn'
                //                                 ]
                //                             }
                //                         ]
                //                     }
                //                 ]
                //             }
                //         }
                //     ]
                // }
            }
        },
        Outputs: {}
    }
}

const indexChar = 'abcdefghijklmnopqrstuvwxyz'.split('')

export default function main(rise) {
    let res = {}
    Object.keys(rise.resolvers.Query || {}).forEach((k) => {
        const item = rise.resolvers.Query[k]
        let toAdd = {}
        let functions = []
        item.forEach((x, i) => {
            if (x.type === 'add') {
                Object.keys(x)
                    .filter((k) => k !== 'type')
                    .forEach((k) => (toAdd[k] = x[k]))
            }

            if (x.type === 'guard') {
                const f = makeGuard({
                    index: indexChar[i],
                    field: k,
                    config: {
                        pk: x.pk,
                        sk: x.sk,
                        path: x.path || false
                    }
                })
                res = {
                    ...res,
                    ...f.Resources
                }
                functions.push(`FunctionGaurd${k}${indexChar[i]}`)
            }
            if (x.type === 'db') {
                if (x.action === 'get') {
                    const f = makeGet()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionGet')
                }
                if (x.action === 'list') {
                    const f = makeQuery()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionQuery')
                }
                if (x.action === 'create') {
                    const f = makeCreate()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionCreate')
                }
                if (x.action === 'remove') {
                    const f = makeRemove()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionRemove')
                }
            }
        })
        res = {
            ...res,
            ...makeQueryPipeline({
                field: k,
                functions: functions,
                config: toAdd
            }).Resources
        }
    })

    Object.keys(rise.resolvers.Mutation || {}).forEach((k) => {
        const item = rise.resolvers.Mutation[k]
        let toAdd = {}
        let functions = []
        item.forEach((x, i) => {
            if (x.type === 'add') {
                Object.keys(x)
                    .filter((k) => k !== 'type')
                    .forEach((k) => (toAdd[k] = x[k]))
            }
            if (x.type === 'guard') {
                const f = makeGuard({
                    index: indexChar[i],
                    field: k,
                    config: {
                        pk: x.pk,
                        sk: x.sk,
                        path: x.path || false
                    }
                })
                res = {
                    ...res,
                    ...f.Resources
                }
                functions.push(`FunctionGaurd${k}${indexChar[i]}`)
            }
            if (x.type === 'db') {
                if (x.action === 'get') {
                    const f = makeGet()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionGet')
                }
                if (x.action === 'list') {
                    const f = makeQuery()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionQuery')
                }
                if (x.action === 'create') {
                    const f = makeCreate()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionCreate')
                }
                if (x.action === 'remove') {
                    const f = makeRemove()
                    res = {
                        ...res,
                        ...f.Resources
                    }
                    functions.push('FunctionRemove')
                }
            }

            if (x.type === 'emit-event') {
                const f = makeEmitEvent({
                    name: `${k}${i}`,
                    config: {
                        eventBus: rise.config.eventBus || 'default',
                        source: rise.config.name,
                        event: x.event,
                        detail: x.data
                    }
                })
                res = {
                    ...res,
                    ...f.Resources
                }
                functions.push(`FunctionEmit${k}${i}`)
            }
        })
        res = {
            ...res,
            ...makeMutationPipeline({
                field: k,
                functions: functions,
                config: toAdd
            }).Resources
        }
    })

    Object.keys(rise.resolvers.Events || {}).forEach((k) => {
        const item = rise.resolvers.Events[k]
        item.forEach((x, i) => {
            if (x.type === 'receive-event') {
                const f1 = eventBridgeTrigger({
                    apiName: rise.config.name,
                    index: i,
                    eventName: x.event,
                    query: x.query,
                    eventInput: x.variables
                })
                const f = makeEventRule({
                    apiName: rise.config.name,
                    eventBus: rise.config.eventBus,
                    eventSource: x.source,
                    eventName: x.event,
                    index: i
                    // eventInput: x.eventInput,
                    // query: x.query //.replace(/(\r\n|\n|\r)/gm, '')
                })
                res = {
                    ...res,
                    ...f1.Resources,
                    ...f.Resources
                }
            }
        })
    })
    return {
        Resources: res
    }
}
