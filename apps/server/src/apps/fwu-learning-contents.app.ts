/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { LegacyLogger } from '@core/logger';
import { SESSION_VALKEY_CLIENT } from '@modules/authentication/authentication-config';
import { FwuLearningContentsModule } from '@modules/fwu-learning-contents/fwu-learning-contents.app.module';
import { enableOpenApiDocs } from './helpers';
import { createRequestLoggerMiddleware } from './helpers/request-logger-middleware';
import legacyRedisUtils = require('../../../../src/utils/redis');

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	// create the NestJS application on a separate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(FwuLearningContentsModule, nestExpressAdapter);
	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	// customize nest app settings
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });
	enableOpenApiDocs(nestApp, 'docs');
	nestApp.use(createRequestLoggerMiddleware());

	// The redisClient must be initialized in the legacy part for the session handling (whitelisting of JWTs) to work.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const sessionValkeyClient = await nestApp.resolve(SESSION_VALKEY_CLIENT);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	legacyRedisUtils.initializeRedisClient(sessionValkeyClient);

	await nestApp.init();

	// mount instances
	const rootExpress = express();

	const port = 4446;
	const basePath = '/api/v3';

	// exposed alias mounts
	rootExpress.use(basePath, nestExpress);
	rootExpress.listen(port);

	console.log('##########################################');
	console.log(`### Start FWU Learning Contents Server ###`);
	console.log(`### Port:      ${port}                    ###`);
	console.log(`### Base path: ${basePath}                 ###`);
	console.log('##########################################');
}
void bootstrap();
