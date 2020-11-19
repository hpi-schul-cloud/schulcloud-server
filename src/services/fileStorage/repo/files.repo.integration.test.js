const { expect } = require('chai');

const { findFilesShardWithUserId, deleteFilesByIDs } = require('./files.repo');

describe('user.repo.integration.test', () => {
	let testUtils;
	let server;
	let app;

	before(async () => {
		/* eslint-disable global-require */
		app = await require('../../../app');
		testUtils = require('../../../../test/services/helpers/testObjects')(app);
		/* eslint-enable global-require */
		server = await app.listen(0);
	});

	after(async () => {
		await server.closed();
	});
});
