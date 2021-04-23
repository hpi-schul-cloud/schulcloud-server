const appPromise = require('../../src/app');
const serviceLimitsTests = require('./serviceLimits');
const routesJWTTests = require('./routes');

const main = async () => {
	const app = await appPromise;
	serviceLimitsTests(app);
	routesJWTTests(app);
};

main();
