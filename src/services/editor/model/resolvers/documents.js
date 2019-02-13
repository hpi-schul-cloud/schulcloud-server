const { gql } = require("apollo-server-core");

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
    docValue <json|documentValue>
    (question) timer <timestemp> - Abgabe bis ein
    flag Array(<String>) enum 'isStudent' (question)

*/

const documentsTypeDefs = gql`
	type Document {
		_empty: String
	}

	extend type Query {
		"Get a document by its Id"
		document(lessonId: String!): Document
	}

	extend type Mutation {
		createDocument(toBeDetermined: String!): Document
		updateDocument(toBeDetermined: String!): Document
		deleteDocument(toBeDetermined: String!): Document
	}

	extend type Subscription {
		documentChanged(documentId: String!): Document
	}
`;

const documentsResolvers = {
	Query: {
		document: (root, args, context, info) => {},
	},
	Mutation: {
		createDocument: (root, args, context, info) => {},
		updateDocument: (root, args, context, info) => {},
		deleteDocument: (root, args, context, info) => {},
	},
	Subscription: {
		documentChanged: (root, args, context, info) => {},
	},
};

module.exports = {
	documentsResolvers,
	documentsTypeDefs,
};
