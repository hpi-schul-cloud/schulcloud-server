const { gql } = require('apollo-server-core');

/*

lessons ( Abbilden der Zusammengehörigkeit von templateDocuments) (question) 
    id
    steps Array(<id::step>)  - die Reihenfolge innerhalb des Arrays spiegelt den Ablauf wieder   (question) ein Object wäre hilfreicher für umsortierung von steps  (question) Bezeichnung steps sollte diskutiert werden. =parts, chapters, topics
    owner <id::groups>
    students <id::groups></id>

*/

const lessonsTypeDefs = gql`
	type Lesson {
		_empty: String
	}

	extend type Query {
		"Get a lesson by its Id"
		lesson(lessonId: String!): Lesson
	}

	extend type Mutation {
		createLesson(toBeDetermined: String!): Lesson
		updateLesson(toBeDetermined: String!): Lesson
		deleteLesson(toBeDetermined: String!): Lesson
	}

	extend type Subscription {
		lessonChanged(lessonId: String!): Lesson
	}
`;

const lessonsResolvers = {
	Query: {
		lesson: (root, args, context, info) => {},
	},
	Mutation: {
		createLesson: (root, args, context, info) => {},
		updateLesson: (root, args, context, info) => {},
		deleteLesson: (root, args, context, info) => {},
	},
	Subscription: {
		lessonChanged: (root, args, context, info) => {},
	},
};

module.exports = {
	lessonsResolvers,
	lessonsTypeDefs,
};
