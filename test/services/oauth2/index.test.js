/* eslint-disable global-require */
const logger = require('../../../src/logger');

// This test is conditionalized. Travis runs both hydra and proxy/mock server
// local computer will only run mock server

const { OAUTH_URL } = require('../../../config/globals');
const freeport = require("freeport");
const testObjects = require("../helpers/testObjects");

describe('oauth2 service', function oauthTest() {
	this.timeout(10000);
	if (OAUTH_URL) {
		logger.info('running BOTH hydra and mock server test');
		require('./hydra');
		require('./mock');
	} else {
		logger.info('running only mock server test.');
		require('./mock');
	}
});

describe('oauth2 token test', () => {
	let server;
	let app;

	before(() => {
		freeport(async (err, port) => {
			if (err) {
				logger.warning('freeport:', err);
			}

			// eslint-disable-next-line global-require
			app = await require('../../../src/app');
			server = app.listen(0);
			testHelpers = testObjects(app);
		});
	});

	after(async () => {
		await server.close();
	});

	it('scope groups set', async () => {
		// hook.params.consentRequest.requested_scope = groups

		// app.service('users').get(hook.params.account.userId)

		//hook.app.service('teams').find({
		// 					query: {
		// 						'userIds.userId': hook.params.account.userId,
		// 					},
		// 			  })

		// app.service('ltiTools').find({
		// 			query: {
		// 				oAuthClientId: hook.params.consentRequest.client.client_id,
		// 				isLocal: true,
		// 			},
		// 		})

		// expect: ${team._id}||${team.name}
	});

	it('scope groups unset', async () => {
	});
});
