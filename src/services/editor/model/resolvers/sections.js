const { gql } = require('apollo-server-core');
/*

Schema: section
    id
    note <String> Notiz zu dem jeweiligen Schritt speichern in dem Fall für den Ersteller der lesson.
    contents Array(<id::documents>) - hiermit können auch mehre documents / Abschnitte nebeneinander dargestellt werden z.b. für Gruppenarbeit mit verschiedenen Aufgabenstellungen

*/
const sectionsTypeDefs = gql`
	type Section {
		id: String!
		title: String
		contents: [Document]!
		lesson: Lesson!
		note: String
	}

	extend type Query {
		"Get a section by its Id"
		section(sectionId: String!): Section
	}

	extend type Mutation {
		createSection(title: String, lessonId: String!, note: String): Section
		updateSection(sectionId: String, contents: [Json], note: String): Section
		deleteSection(toBeDetermined: String!): Section
	}

	extend type Subscription {
		sectionChanged(sectionId: String!): Section
	}
`;

const sectionsResolvers = {
	Query: {
		section: (root, args, context, info) => {
			// TODO:
			// args contain the sectionId
			// return the section
		},
	},
	Mutation: {
		createSection: (root, args, context, info) => {
			// TODO:
			// create a section in the database
			// args contain title (optional), lessonId (required) and note (optional)
			// the section should be added to the corresponding lesson sections array
			// an empty document should be created - this should be referenced in the contents array
			/* return the section
				section {
					title
					contents,
					lessonId,
					note,
				}

			*/
		},
		updateSection: (root, args, context, info) => {
			// TODO:
			// args contain sectionId, contents (optional), note (optional)
			// save the updated values
			// return the section
		},
		deleteSection: (root, args, context, info) => {},
		// NOTE: We could easily add addDocumentToSection(sectionId, documentId) || createAndAddDocumentToSection(sectionId, docValue) or something like that here
	},
	Subscription: {
		sectionChanged: (root, args, context, info) => {},
	},
};

module.exports = {
	sectionsResolvers,
	sectionsTypeDefs,
};
