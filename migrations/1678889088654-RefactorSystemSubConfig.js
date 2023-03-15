const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');
const { connect, close } = require('../src/utils/database');

const System = mongoose.model(
	'systemSchemaIdpHintRefactor',
	new mongoose.Schema(
		{
			oauthConfig: {
				type: {
					alias: { type: String, required: false },
				},
				required: false,
			},
			oidcConfig: {
				type: {
					alias: { type: String, required: false },
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
		await System.updateMany(
			{ oidcConfig: { $ne: null }, 'oidcConfig.alias': { $exists: true } },
			{ $rename: { 'oidcConfig.alias': 'oidcConfig.idpHint' } }
		);
		alert(`Renamed oidcConfig alias to idpHint`);
		await System.updateMany(
			{ oauthConfig: { $ne: null }, 'oauthConfig.alias': { $exists: true } },
			{ $rename: { 'oauthConfig.alias': 'oauthConfig.idpHint' } }
		);
		alert(`Renamed oauthConfig alias to idpHint`);
		alert(`...finished!`);
		await close();
	},

	down: async function down() {
		await connect();
		await System.updateMany(
			{ oidcConfig: { $ne: null }, 'oidcConfig.idpHint': { $exists: true } },
			{ $rename: { 'oidcConfig.idpHint': 'oidcConfig.alias' } }
		);
		alert(`Renamed oidcConfig idpHint to alias`);
		await System.updateMany(
			{ oauthConfig: { $ne: null }, 'oauthConfig.idpHint': { $exists: true } },
			{ $rename: { 'oauthConfig.idpHint': 'oauthConfig.alias' } }
		);
		alert(`Renamed oauthConfig idpHint to alias`);
		alert(`...finished!`);
		await close();
	},
};
