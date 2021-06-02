const appPromise = require('../../src/app');
const serviceLimitsTests = require('./serviceLimits');
const routesJWTTests = require('./routes');
const servicePerformance = require('./servicePerformance');

// app must called before, because the test setup with it is build on the fly by running the test
const main = async () => {
	const app = await appPromise;
	serviceLimitsTests(app);
	routesJWTTests(app);
	servicePerformance(app);
};

main();
