const { gql } = require("apollo-server-core");

const usersTypeDefs = gql`
	scalar Json
	type User {
		name: String!
		id: String!
		isTeacher: Boolean!
	}
	extend type Query {
		"Get a user by his/her Id"
		user(userId: String!): User
	}
`;

const usersResolvers = {
	Query: {
		user: (root, args, context, info) => {
			// TODO:
			// args contain userId
			// return the user
			// {id, name, isTeacher} (feel free to rename isTeacher)
		},
	},
};

module.exports = {
	usersTypeDefs,
	usersResolvers,
};
