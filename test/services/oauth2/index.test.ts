/* eslint-disable global-require */
import logger from '../../../src/logger';

// This test is conditionalized. Travis runs both hydra and proxy/mock server
// local computer will only run mock server

import { OAUTH_URL } from '../../../config/globals';

describe('oauth2 service', function oauthTest() {
	this.timeout(10000);
	if (OAUTH_URL) {
		logger.info('running BOTH hydra and mock server test');
		import('./hydra');
		import('./mock');
	} else {
		logger.info('running only mock server test.');
		import('./mock');
	}
});
