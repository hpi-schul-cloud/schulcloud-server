const { gql } = require("apollo-server-core");

const baseTypeDefs = gql`
	scalar Json
	type Query {
		_empty: String
	}

	type Mutation {
		_empty: String
	}

	type Subscription {
		_empty: String
	}
`;

module.exports = {
	baseTypeDefs,
};
