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
					clientId: { type: String, required: true },
					clientSecret: { type: String, required: true },
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
		},
		{
			timestamps: true,
		}
	),
	'systems'
);

// This migration renames a field and removes an unnecessary one

module.exports = {
	up: async function up() {
		await connect();
		// Rename field codeRedirectUri -> redirectUri
		await System.updateMany(
			{ oauthConfig: { $ne: null } },
			{ $rename: { 'oauthConfig.codeRedirectUri': 'oauthConfig.redirectUri' } }
		);
		alert(`Renamed codeRedirectUri to redirectUri`);
		// Drop field tokenRedirectUri
		await System.updateMany({ oauthConfig: { $ne: null } }, { $unset: { 'oauthConfig.tokenRedirectUri': 1 } });
		alert(`Dropped field tokenRedirectUri`);
		await close();
	},

	down: async function down() {
		await connect();
		// Create tokenRedirectUri and copy value
		const systems = await System.find({ oauthConfig: { $ne: null } })
			.lean()
			.exec();
		alert(`Reading systems`);
		const responses = systems.map((system) =>
			System.findOneAndUpdate(
				{
					_id: system._id,
				},
				{
					$set: { 'oauthConfig.tokenRedirectUri': `${system.oauthConfig.redirectUri}/token` },
				}
			)
				.lean()
				.exec()
		);
		await Promise.all(responses);
		alert(`Added field tokenRedirectUri`);
		// Rename field redirectUri -> codeRedirectUri
		await System.updateMany(
			{ oauthConfig: { $ne: null } },
			{ $rename: { 'oauthConfig.redirectUri': 'oauthConfig.codeRedirectUri' } }
		);
		alert(`Renamed redirectUri to codeRedirectUri`);
		alert(`...finished!`);
		await close();
	},
};
