// model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.

const mongoose = require('mongoose');

const tspBaseType = require('../sync/strategies/TSP/TSPBaseSyncer').SYNCER_TARGET;
const tspSchoolType = require('../sync/strategies/TSP/TSPSchoolSyncer').SYNCER_TARGET;

const { Schema } = mongoose;

const types = [
	'local', // username + password
	'moodle',
	'itslearning',
	'lernsax',
	'iserv', // SSO providers
	'ldap', // general and provider-specific LDAP
	'oidc',
	tspBaseType,
	tspSchoolType, // Thüringer Schul-Portal
];

const systemSchema = new Schema(
	{
		type: { type: String, required: true, enum: types },
		url: { type: String, required: false },
		alias: { type: String },
		oaClientId: { type: String }, // just for oauth2-systems
		oaClientSecret: { type: String }, // just for oauth2-systems
		provisioningStrategy: { type: String, required: false },
		provisioningUrl: { type: String, required: false },
		oauthConfig: {
			type: {
				clientId: { type: String, required: true },
				clientSecret: { type: String, required: true },
				tokenEndpoint: { type: String, required: true },
				grantType: { type: String, required: true },
				redirectUri: { type: String, required: true },
				scope: { type: String, required: true },
				responseType: { type: String, required: true },
				authEndpoint: { type: String, required: true },
				provider: { type: String, required: true },
				logoutEndpoint: { type: String, required: false },
				issuer: { type: String, required: true },
				jwksEndpoint: { type: String, required: true },
			},
			required: false,
		},
		ldapConfig: {
			active: { type: Boolean },
			federalState: { type: Schema.Types.ObjectId, ref: 'federalstate' },
			lastSyncAttempt: { type: Date },
			lastSuccessfulFullSync: { type: Date },
			lastSuccessfulPartialSync: { type: Date },
			lastModifyTimestamp: { type: String },
			url: { type: String },
			rootPath: { type: String },
			searchUser: { type: String },
			searchUserPassword: { type: String },
			provider: { type: String },
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
		tsp: {
			identifier: { type: String }, // "schuleNummer"
			schoolName: { type: String }, // "schuleName"
			baseUrl: { type: String },
		},
	},
	{
		timestamps: true,
	}
);

const systemModel = mongoose.model('system', systemSchema);

module.exports = systemModel;
