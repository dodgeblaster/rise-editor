const crudl = `module.exports = {
    schema: \`
        type Note {
            pk: String
            sk: String
            title: String
            content: String
        }

        input CreateNoteInput {
            title: String
            content: String
        }

        input UpdateNoteInput {
            sk: String
            title: String
            content: String
        }

        input RemoveNoteInput {
            sk: String
        }

        type Query {
            note(sk: String): Note
            notes: [Note]
        }

        type Mutation {
            create(input: CreateNoteInput): Note
            update(input: UpdateNoteInput): Note
            remove(input: RemoveNoteInput): Note
      
        }
    \`,
    resolvers: {
        Query: {
            note: [
                {
                    type: 'add',
                    pk: '!sub'
                },
                {
                    type: 'db',
                    action: 'get'
                }
            ],
            notes: [
                {
                    type: 'add',
                    pk: '!sub',
                    sk: 'note_'
                },
                {
                    type: 'db',
                    action: 'list'
                }
            ]
        },
        Mutation: {
            create: [
                {
                    type: 'add',
                    pk: '!sub',
                    sk: 'note_@id'
                },
                {
                    type: 'db',
                    action: 'create'
                },
            ],
            update: [
                {
                    type: 'add',
                    pk: '!sub'
                },
                {
                    type: 'db',
                    action: 'create'
                },
            ],
            remove: [
                {
                    type: 'add',
                    pk: '!sub'
                },
                {
                    type: 'db',
                    action: 'remove'
                },
            ]
        }
    },
    config: {
        name: 'myApp',
        region: 'us-east-2'
    }
}`

const group = `const isInGroup = {
    type: 'guard',
    pk: '$group',
    sk: 'member_!sub'
}

module.exports = {
    schema: \`
        type Group {
            pk: String
            sk: String
            name: String
        }

        type GroupMember {
            pk: String
            sk: String
            name: String
        }

        input CreateGroupInput {
            name: String
        }
        
        input CreateGroupMemberInput {
            id: String
            name: String
        }

        input RemoveGroupInput {
            id: String
        }
        
        input RemoveGroupMemberInput {
            groupId: String,
            memberId: String
        }

        type Query {
            group(sk: String): Group
            groupMembers(sk:String): [GroupMember]
        }

        type Mutation {
            createGroup(input: CreateGroupInput): Group
            createGroupMember(input: CreateGroupMemberInput): GroupMember
            removeGroup(input: RemoveGroupInput): Group
            removeGroupMember(input: RemoveGroupMemberInput): GroupMember
        }
    \`,
    resolvers: {
        Query: {
            group: [
                isInGroup,
                {
                    type: 'add', 
                    pk: 'group' 
                },
                {
                    type: 'db', 
                    action: 'get' 
                },
            ],
            groupMembers: [
                isInGroup,
                {
                    type: 'add', 
                    pk: '$group',
                    sk: 'member_'
                },
                {
                    type: 'db', 
                    action: 'list' 
                },
            ]
        },
        Mutation: {
            createGroup: [
                {
                    type: 'db', 
                    action: 'create' 
                }
            ],
            createGroupMember: [
                isInGroup,
                {
                    type: 'db', 
                    action: 'create' 
                }
            ],
            remove: [
                isInGroup,
                {
                    type: 'db', 
                    action: 'remove' 
                }
            ],
            removeGroupMember: [
                isInGroup,
                {
                    type: 'db', 
                    action: 'create' 
                }
            ],
        }
    },
    config: {
        name: 'myGroupApp',
        region: 'us-east-2',
        auth: true
    }
}`

const sendAndReceive = `module.exports = {
    schema: \`
         input CreateInput {
            name: String
            pk: String
        }
        
        input CompleteInput {
            pk: String
            sk: String
            status: String
        }

        type Query {
            processes: [String]
        
        }
        type Mutation {
            startProcess(input: CreateInput): String
            completeProcess(input: CompleteInput): String
            @aws_iam 
        }
    \`,
    resolvers: {
        Query: {
            processes: [
        
                {
                    type: 'add',
                    pk: 'process',
                    sk: 'process_'
                },
                {
                    type: 'db',
                    action: 'list'
                },
            ]
        },
        Mutation: {
            startProcess: [
                {
                    type: 'add',
                    pk: 'process',
                    sk: 'process_@id'
                },
                {
                    type: 'db',
                    action: 'create'
                },
                {
                    type: 'emit-event',
                    event: 'startProcess',
                    data: {
                        pk: '#pk',
                        sk: '#sk',
                        status: 'starting'
                    }
                
              
                }
            ],

            completeProcess: [
                {
                    type: 'add',
                    pk: '$pk',
                    sk: '$sk',
                    status: '$status'
                },
                {
                    type: 'db',
                    action: 'create'
                },
            ]
        },

        Events: {
            processCompleted: [
                {
                    type: 'receive-event',
                    source: 'accounting',
                    event: 'processCompleted',
                    query: \`
                        mutation completeProcess($input: CompleteInput) {
                            completeProcess(input: $input)
                        }
                    \`,
                    variables: {
                        pk: 'detail.pk',
                        sk: 'detail.sk',
                        status: 'detail.status'
                    }
                },
            ]
        }
    },
    config: {
        name: 'exampleapi',
        region: 'us-east-2',
        eventBus: 'ExampleBusinessLogic'
    }
}`

export default { crudl, group, sendAndReceive }
