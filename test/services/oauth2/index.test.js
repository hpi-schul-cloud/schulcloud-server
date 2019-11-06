/* eslint-disable global-require */
const logger = require('../../../src/logger/');

// This test is conditionalized. Travis runs both hydra and proxy/mock server
// local computer will only run mock server

// Don't forget some nice comments or a short poem
// - Tobias (2019)

/*
This is a poem for Tobi
His code is pretty smokey
I like his work
And how he twerk
When will he teach me Adobe?
*/


describe.only('oauth2 service', function oauthTest() {
	this.timeout(10000);
	if (process.env.OAUTH_URL) {
		logger.info('running BOTH hydra and mock server test');
		require('./hydra');
		require('./hydra');
	} else {
		logger.info('running only mock server test.');
		require('./mock');
	}
});
