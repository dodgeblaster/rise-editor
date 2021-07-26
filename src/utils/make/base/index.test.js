const transformIn = require('./in')
const transformOut = require('./out')

const mockRise = {
    schema: `
        type Query {
            hello: String
        }
    `,
    resolvers: {
        hello: [
            {
                type: 'add',
                sk: 'note_@id'
            }
        ]
    },
    config: {
        name: 'blue'
    }
}

test('will return basic resources', () => {
    const res = transformIn(mockRise)
    console.log(JSON.stringify(res, null, 2))

    const res2 = transformOut(res)

    console.log(JSON.stringify(res2, null, 2))
})
