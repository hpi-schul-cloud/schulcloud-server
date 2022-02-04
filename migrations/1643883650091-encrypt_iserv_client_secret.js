const mongoose = require('mongoose');
const { Configuration } = require('@hpi-schul-cloud/commons');
// eslint-disable-next-line no-unused-vars
const { alert, info, error } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const systemModel = require('../src/services/system/model');

// TODO npm run migration-persist and remove this line
// TODO update seed data and remove this line

const stages = [
	{
		name: 'staging',
		id: 'staging_id_iserv',
		config: {
			client_id: '58_qe54d8bh0v4gog8sw0w88c0s8cwwocc8wk8oo00s4c0g8gkc8',
			client_secret:
				'U2FsdGVkX18JzdW2LOjhhsn4aIj3En6BBh9QSO9dgUrjIoZp97ptJ1sAeEElTH6/NY0dUX8k3C5JL75dZqJlFGaTpfKkoPuw0tSGZGyw8dQ=',
			token_endpoint: 'http://iserv.n21.dbildungscloud.de/iserv/auth/public/token',
			grant_type: 'authorization_code',
			token_redirect_uri: 'http://localhost:3030/api/v3/oauth/0000d186816abba584714c92/token',
			scope: 'openid uuid',
			response_type: 'code',
			code_redirect_uri: 'http://localhost:3030/api/v3/oauth/0000d186816abba584714c92',
			base_redirect_uri: 'http://localhost:3030/api/v3/oauth',
			auth_endpoint: 'http://iserv.n21.dbildungscloud.de/iserv/auth/auth',
		},
	},
	{
		name: 'produktion',
		id: 'produktion_id_iserv',
		config: {
			client_id: '58_qe54d8bh0v4gog8sw0w88c0s8cwwocc8wk8oo00s4c0g8gkc8',
			client_secret:
				'U2FsdGVkX18JzdW2LOjhhsn4aIj3En6BBh9QSO9dgUrjIoZp97ptJ1sAeEElTH6/NY0dUX8k3C5JL75dZqJlFGaTpfKkoPuw0tSGZGyw8dQ=',
			token_endpoint: 'http://iserv.n21.dbildungscloud.de/iserv/auth/public/token',
			grant_type: 'authorization_code',
			token_redirect_uri: 'http://localhost:3030/api/v3/oauth/0000d186816abba584714c92/token',
			scope: 'openid uuid',
			response_type: 'code',
			code_redirect_uri: 'http://localhost:3030/api/v3/oauth/0000d186816abba584714c92',
			base_redirect_uri: 'http://localhost:3030/api/v3/oauth',
			auth_endpoint: 'http://iserv.n21.dbildungscloud.de/iserv/auth/auth',
		},
	},
];

module.exports = {
	up: async function up() {
		await connect();

		info('creating oauthconfig for iserv');

		await Promise.all(
			stages.map(async (stage) => {
				const systems = await systemModel.find({ _id: stage.id });
				if (systems.length === 1) {
					info(`Found iserv system for ${stage.name}.`);
					systems[0].oauthconfig = stage.config;
					return systems[0].save();
				}
				return Promise.resolve();
			})
		);
		await close();
	},

	down: async function down() {
		await connect();

		info('deleting oauthconfig for iserv');

		await Promise.all(
			stages.map(async (stage) => {
				const systems = await systemModel.find({ _id: stage.id });
				if (systems.length === 1) {
					info(`Found iserv system for ${stage.name}.`);
					delete systems[0].oauthconfig;
					return systems[0].save();
				}
				return Promise.resolve();
			})
		);
		await close();
	},
};
