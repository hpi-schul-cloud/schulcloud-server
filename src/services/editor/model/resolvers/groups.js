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
		_empty: String
	}

	extend type Query {
		"Get a group by its Id"
		group(group: String!): Group
	}

	extend type Mutation {
		createGroup(toBeDetermined: String!): Group
		updateGroup(toBeDetermined: String!): Group
		deleteGroup(toBeDetermined: String!): Group
	}

	extend type Subscription {
		groupChanged(groupId: String!): Group
	}
`;

const groupsResolvers = {
	Query: {
		group: (root, args, context, info) => {},
	},
	Mutation: {
		createGroup: (root, args, context, info) => {},
		updateGroup: (root, args, context, info) => {},
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
