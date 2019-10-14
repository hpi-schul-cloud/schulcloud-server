// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const { Schema } = mongoose;

const types = ['moodle', 'itslearning', 'lernsax', 'iserv', 'local', 'ldap'];

const systemSchema = new Schema({
	type: { type: String, required: true, enum: types },
	url: { type: String, required: false },
	alias: { type: String },
	oaClientId: { type: String }, // just for oauth2-systems
	oaClientSecret: { type: String }, // just for oauth2-systems
	ldapConfig: {
		active: { type: Boolean },
		url: { type: String },
		rootPath: { type: String },
		searchUser: { type: String },
		searchUserPassword: { type: String },
		provider: { type: String },
		importUser: { type: String },
		importUserPassword: { type: String },
		importUrl: { type: String },
		providerOptions: {
			schoolName: { type: String },
			userPathAdditions: { type: String },
			classPathAdditions: { type: String },
			roleType: { type: String },
			userAttributeNameMapping: {
				givenName: { type: String },
				sn: { type: String },
				dn: { type: String },
				uuid: { type: String },
				uid: { type: String },
				mail: { type: String },
				role: { type: String },
			},
			roleAttributeNameMapping: {
				roleStudent: { type: String },
				roleTeacher: { type: String },
				roleAdmin: { type: String },
				roleNoSc: { type: String },
			},
			classAttributeNameMapping: {
				description: { type: String },
				dn: { type: String },
				uniqueMember: { type: String },
			},
		},
	},
}, {
	timestamps: true,
});

const systemModel = mongoose.model('system', systemSchema);

module.exports = systemModel;
