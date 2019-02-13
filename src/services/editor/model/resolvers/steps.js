const { gql } = require('apollo-server-core');
/*

Schema: step
    id
    note <String> Notiz zu dem jeweiligen Schritt speichern in dem Fall für den Ersteller der lesson.
    target Array(<id::documents>) - hiermit können auch mehre documents / Abschnitte nebeneinander dargestellt werden z.b. für Gruppenarbeit mit verschiedenen Aufgabenstellungen

*/
const stepsTypeDefs = gql`
	type Step {
		_empty: String
	}

	extend type Query {
		"Get a step by its Id"
		step(stepId: String!): Step
	}

	extend type Mutation {
		createStep(toBeDetermined: String!): Step
		updateStep(toBeDetermined: String!): Step
		deleteStep(toBeDetermined: String!): Step
	}

	extend type Subscription {
		stepChanged(stepId: String!): Step
	}
`;

const stepsResolvers = {
	Query: {
		step: (root, args, context, info) => {},
	},
	Mutation: {
		createStep: (root, args, context, info) => {},
		updateStep: (root, args, context, info) => {},
		deleteStep: (root, args, context, info) => {},
	},
	Subscription: {
		stepChanged: (root, args, context, info) => {},
	},
};

module.exports = {
	stepsResolvers,
	stepsTypeDefs,
};
