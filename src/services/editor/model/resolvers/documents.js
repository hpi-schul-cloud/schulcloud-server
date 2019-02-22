const { gql } = require('apollo-server-core');

/*

Schema: permissionState  - (question) welche permission benötigen wir

    write <Boolean>,
    read <Boolean>,
    create <Boolean>,
    delete <Boolean>


Schema: permission

    group <groups>
    permission <Schema:permissionState>


documents

    id
    lesson <id::lessons>
    owner <id::groups>
    parent <id::documents>
    permission Array(<permission>) (für Gruppen)  - hier können Sichtbarkeiten für die Gruppen verändert werden, Edit Modus nach einer bestimmten Zeit wieder weg nehmen beendet das editieren der subDocuments/groupDocuments das Backend muss für die Childs das lösen
    docValue <Json|documentValue>
    (question) timer <timestemp> - Abgabe bis ein
    flag Array(<String>) enum 'isStudent' (question)

*/

const documentsTypeDefs = gql`
	type Document {
		id: String!
		docValue: Json!
	}

	extend type Query {
		"Get a document by its Id"
		document(lessonId: String!): Document
	}

	extend type Mutation {
		createDocument(docValue: Json): Document
		updateDocument(documentId: String!, docValue: Json): Document
		deleteDocument(toBeDetermined: String!): Document
	}

	extend type Subscription {
		documentChanged(documentId: String!): Document
	}
`;

const documentsResolvers = {
	Query: {
		document: (root, args, context, info) => {
			// TODO:
			// args contain documentId
			// return document
			// {id, docValue}
			return {};
		},
	},
	Mutation: {
		createDocument: (root, args, context, info) => {
			// TODO
			// args contain docValue
			// create a new document with the given value and return it
			return {};
		},
		updateDocument: (root, args, context, info) => {
			// TODO
			// args contain documentId and docValue
			// update the document in the database and return it
			return {};
		},
		deleteDocument: (root, args, context, info) => {
			return {};
		},
	},
	Subscription: {
		documentChanged: (root, args, context, info) => {
			return {};
		},
	},
};

module.exports = {
	documentsResolvers,
	documentsTypeDefs,
};
