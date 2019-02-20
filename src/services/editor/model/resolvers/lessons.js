const { gql } = require("apollo-server-core");

const lessonsTypeDefs = gql`
	type Lesson {
		id: String!
		students: [Group]!
		owner: Group!
		sections: [Sections]
		topic: Json
		course: Json
	}

	extend type Query {
		"Get a lesson by its Id"
		lesson(lessonId: String!): Lesson
	}

	extend type Mutation {
		createLesson(topicId: String!, courseId: String!, ownerId: String!): Lesson
		updateLesson(
			lessonId: String!
			ownerId: String!
			sections: [Json]
			students: [Json]
		): Lesson
		deleteLesson(toBeDetermined: String!): Lesson
	}

	extend type Subscription {
		lessonChanged(lessonId: String!): Lesson
	}
`;

const lessonsResolvers = {
	Query: {
		lesson: (root, args, context, info) => {
			// TODO:
			// return all db fields: sections, owner, students, course, topic
			/*
			return {
				id: "id",
				students: [],
				owner: {
					name,
					id,
				},

				sections: [
					{
						id,
						notes,
						title,
						docValue,
					},
				],

				topic: {
					// parent
					name,
					id,
				},

				course: {
					// parent
					name,
					id,
					teacherIds,
					substitutionTeacherIds,
				},
				};
				*/
		},
	},
	Mutation: {
		createLesson: (root, args, context, info) => {
			// TODO:
			// create a lesson in the database
			// args contain topicId, courseId, ownerId
			// sections should be an empty array
			// students should be "copied" over from the course
			/* save the following:
			    id
    			sections Array(<id::step>)  - die Reihenfolge innerhalb des Arrays spiegelt den Ablauf wieder   (question) ein Object wäre hilfreicher für umsortierung von steps  (question) Bezeichnung steps sollte diskutiert werden. =parts, chapters, topics
    			owner <id::groups>
				students <id::groups></id>
				course id::course
				topic id::topic
			*/
		},
		updateLesson: (root, args, context, info) => {
			// TODO:
			// args contain lessonId, and potentially ownerId, sections Array, students
			// update these fields in the db
		},
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
