const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const System = mongoose.model(
	'systemSchemaOauthRefactor',
	new mongoose.Schema(
		{
			oauthConfig: {
				type: {
					redirectUri: { type: String, required: true },
					codeRedirectUri: { type: String },
					tokenRedirectUri: { type: String },
				},
				required: false,
			},
		},
		{
			timestamps: true,
		}
	),
	'users'
);

// This migration renames a field and removes an unnecessary one

module.exports = {
	up: async function up() {
		await connect();
		// Rename
		await System.updateMany({ oauthConfig: { $ne: null } }, { $rename: { codeRedirectUri: 'redirectUri' } });
		// Drop old field
		await System.updateMany({ oauthConfig: { $ne: null } }, (err, system) => {
			system.oauthConfig.tokenRedirectUri = undefined;
			system.save();
		});
		await close();
	},

	down: async function down() {
		await connect();
		// Rename back redirectUri -> codeRedirectUri
		await System.updateMany({ oauthConfig: { $ne: null } }, { $rename: { redirectUri: 'codeRedirectUri' } });
		// Create tokenRedirectUri and copy value
		await System.updateMany({ oauthConfig: { $ne: null } }, (err, system) => {
			system.oauthConfig.codeRedirectUri = system.oauthConfig.redirectUri;
			system.oauthConfig.tokenRedirectUri = `${system.oauthConfig.redirectUri}/token`;
			system.oauthConfig.redirectUri = undefined;
			system.save();
		});
		await close();
	},
};
