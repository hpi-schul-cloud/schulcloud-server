const mongoose = require('mongoose');
// eslint-disable-next-line no-unused-vars
const { alert, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const Systems = mongoose.model(
	'system2023101111140',
	new mongoose.Schema(
		{
			alias: { type: String },
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

module.exports = {
	up: async function up() {
		await connect();

		const result = await Systems.findOneAndUpdate(
			{ alias: 'SANIS' },
			{
				$unset: {
					'oauthConfig.logoutEndpoint': 1,
				},
			}
		)
			.lean()
			.exec();

		if (result) {
			alert(`Removed logoutEndpoint from oauthConfig of sanis/moin.schule system`);
		} else {
			alert('No matching document found with alias "SANIS" and logoutEndpoint');
		}

		await close();
	},

	down: async function down() {
		await connect();

		const system = await Systems.findOne({ alias: 'SANIS' }).lean().exec();

		if (system) {
			const { authEndpoint } = system.oauthConfig;
			const logoutEndpoint = authEndpoint.replace(/\/auth$/, '/logout');

			await Systems.findOneAndUpdate(
				{ alias: 'SANIS' },
				{
					$set: {
						'oauthConfig.logoutEndpoint': logoutEndpoint,
					},
				}
			)
				.lean()
				.exec();
		}

		alert(`Added logoutEndpoint to oauthConfig of sanis/moin.schule system`);

		await close();
	},
};
