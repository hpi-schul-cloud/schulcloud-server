const { merge } = require("lodash");
const { lessonsTypeDefs, lessonsResolvers } = require("./resolvers/lessons.js");
const { groupsTypeDefs, groupsResolvers } = require("./resolvers/groups.js");
const { stepsTypeDefs, stepsResolvers } = require("./resolvers/steps.js");
const { usersTypeDefs, usersResolvers } = require("./resolvers/users.js");

const {
	documentsTypeDefs,
	documentsResolvers,
} = require("./resolvers/documents.js");
const { baseTypeDefs } = require("./resolvers/base.js");

const resolvers = merge(
	{},
	lessonsResolvers,
	groupsResolvers,
	stepsResolvers,
	documentsResolvers,
	usersResolvers,
);

// See https://blog.apollographql.com/modularizing-your-graphql-schema-code-d7f71d5ed5f2
// especially in order to depend on each other as a type
const typeDefs = [
	baseTypeDefs,
	usersTypeDefs,
	lessonsTypeDefs,
	groupsTypeDefs,
	stepsTypeDefs,
	documentsTypeDefs,
];

module.exports = {
	resolvers,
	typeDefs,
};
