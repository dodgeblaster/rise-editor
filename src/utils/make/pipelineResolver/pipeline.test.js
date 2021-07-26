const transformIn = require('./in')
// const transformOut = require('./out')

const mockRise = {
    schema: `
        type Query {
            hello: String
        }
    `,
    resolvers: {
        Query: {
            hello: [
                {
                    type: 'add',
                    sk: 'note_@id'
                }
            ]
        },
        Mutation: {
            create: [
                {
                    type: 'add',
                    sk: 'note_@id'
                },
                {
                    type: 'db',
                    action: 'create'
                }
            ]
        }
    },
    config: {
        name: 'blue'
    }
}

test('will return pipeline resolvers', () => {
    const res = transformIn(mockRise)
    console.log(JSON.stringify(res, null, 2))

    // const res2 = transformOut(res)

    // console.log(JSON.stringify(res2, null, 2))
})
