// import { ExpressAdapter } from '@nestjs/platform-express';
// import express from 'express';
// import legacyAppPromise = require('../../../../../src/app');

// export const feathersExpressTestApp = async () => {
// 	// load the legacy feathers/express server
// 	const feathersExpress = await legacyAppPromise;
// 	feathersExpress.setup();

// 	// create the NestJS application on a seperate express instance
// 	const nestExpress = express();

// 	// set reference to legacy app as an express setting so we can
// 	// access it over the current request within FeathersServiceProvider
// 	// TODO remove if not needed anymore
// 	nestExpress.set('feathersApp', feathersExpress);
// 	const nestExpressAdapter = new ExpressAdapter(nestExpress);
// 	return nestExpressAdapter;
// };
