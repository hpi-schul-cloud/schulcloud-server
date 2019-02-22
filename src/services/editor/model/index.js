// const { merge } = require('lodash');
// const { lessonsTypeDefs, lessonsResolvers } = require('./resolvers/lessons');
 const { groupsTypeDefs, groupsResolvers } = require('./resolvers/groups');
// const { sectionsTypeDefs, sectionsResolvers } = require('./resolvers/sections');
// const { usersTypeDefs, usersResolvers } = require('./resolvers/users');
 const { documentsTypeDefs, documentsResolvers } = require('./resolvers/documents');
const { baseTypeDefs } = require('./resolvers/base');
/*
const resolvers = merge(
	{},
	lessonsResolvers,
	groupsResolvers,
	sectionsResolvers,
	documentsResolvers,
	usersResolvers,
); */
const resolvers = Object.assign(
	{},
//	lessonsResolvers,
	groupsResolvers,
//	sectionsResolvers,
	documentsResolvers,
//	usersResolvers,
);

// See https://blog.apollographql.com/modularizing-your-graphql-schema-code-d7f71d5ed5f2
// especially in order to depend on each other as a type
const typeDefs = [
	baseTypeDefs,
//	usersTypeDefs,
//	lessonsTypeDefs,
	groupsTypeDefs,
//	sectionsTypeDefs,
	documentsTypeDefs,
];

module.exports = {
	resolvers,
	typeDefs,
};
