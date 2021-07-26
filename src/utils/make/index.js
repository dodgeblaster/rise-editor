const base = require('./base/in')
const resolvers = require('./pipelineResolver/in')

module.exports = (r) => {
    const res = base(r)
    const res2 = resolvers(r)
    const res3 = {
        Resources: {
            ...res.Resources,
            ...res2.Resources
        },
        Outputs: {
            ...res.Outputs,
            ...res2.Outputs
        }
    }

    return res3
}
