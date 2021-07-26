module.exports = (cf) => {
    const name = cf.Resources.GraphQlApi.Properties.Name
    const schema = cf.Resources.GraphQlSchema.Properties.Definition
    return {
        schema: schema,
        resolvers: {},
        config: {
            name
        }
    }
}
