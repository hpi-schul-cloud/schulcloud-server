const { gql } = require("apollo-server-core");

/*

groups (Wird auch für einzelne Nutzer verwendet mit ein users array und einem Element)

    id
    users Array(<id::users>)
    typ → (question)
    context → halte ich für nicht erforderlich (question)

*/
const groupsTypeDefs = gql`
	type Group {
		id: String!
		users: [User]!
	}

	extend type Query {
		"Get a group by its Id"
		group(groupId: String!): Group
	}

	extend type Mutation {
		createGroup(userIds: [String]!): Group
		updateGroup(groupId: String!, userIds: [String]!): Group
		deleteGroup(toBeDetermined: String!): Group
	}

	extend type Subscription {
		groupChanged(groupId: String!): Group
	}
`;

const groupsResolvers = {
	Query: {
		group: (root, args, context, info) => {
			// TODO
			// return group with args.groupId
		},
	},
	Mutation: {
		createGroup: (root, args, context, info) => {
			// TODO:
			// create a group and return it
			// the args contain userIds, an array of strings
		},
		updateGroup: (root, args, context, info) => {
			// TODO:
			// the args contain userIds, an array of strings, and the groupId
		},
		deleteGroup: (root, args, context, info) => {},
	},
	Subscription: {
		groupChanged: (root, args, context, info) => {},
	},
};

module.exports = {
	groupsResolvers,
	groupsTypeDefs,
};
