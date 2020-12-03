const appPromise = require('../../src/app');
const testObjects = require('../services/helpers/testObjects')(appPromise);

/**
 * wraps a test function in describe/it to have a running app server listening
 * @param {*} testFunction
 */
const withApp = (testFunction) => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	return testFunction;
};

module.exports = { withApp, testObjects };
