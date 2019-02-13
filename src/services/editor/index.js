const { ApolloServer } = require('apollo-server-express');
const logger = require('winston');

const { typeDefs, resolvers } = require('./model');
const { createContext } = require('./model/context');

const SCApolloServer = app => new ApolloServer({
	typeDefs,
	resolvers,
	// If you need to provide any models to the resolvers, load and provide them in context
	context: createContext(app),
});

module.exports = function setup() {
	const app = this;
	const server = SCApolloServer(app);
	server.applyMiddleware({ app });
	const httpServer = app.listen({ port: 4000 },
		() => logger.info(`GraphQL endpoint ready at port 4000, ${server.graphqlPath}, ${server.subscriptionsPath}`));
	server.installSubscriptionHandlers(httpServer);
};
