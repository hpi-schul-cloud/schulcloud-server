/* istanbul ignore file */
/* eslint-disable no-console */
import { LegacyLogger, Logger } from '@core/logger';
import { SESSION_VALKEY_CLIENT } from '@modules/authentication/authentication-config';
import { CommonCartridgeApiModule } from '@modules/common-cartridge/common-cartridge-api.app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';
import {
	addPrometheusMetricsMiddlewaresIfEnabled,
	AppStartLoggable,
	createAndStartPrometheusMetricsAppIfEnabled,
	enableOpenApiDocs,
} from './helpers';
import { createRequestLoggerMiddleware } from './helpers/request-logger-middleware';
import legacyRedisUtils = require('../../../../src/utils/redis');

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(CommonCartridgeApiModule, nestExpressAdapter);
	enableOpenApiDocs(nestApp, 'docs');

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	// The redisClient must be initialized in the legacy part for the session handling (whitelisting of JWTs) to work.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const sessionValkeyClient = await nestApp.resolve(SESSION_VALKEY_CLIENT);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	legacyRedisUtils.initializeRedisClient(sessionValkeyClient);

	await nestApp.init();

	const rootExpress = express();
	const logger = await nestApp.resolve(Logger);
	nestApp.use(createRequestLoggerMiddleware());

	addPrometheusMetricsMiddlewaresIfEnabled(logger, rootExpress);

	const basePath = '/api/v3';
	const port = 3350;

	rootExpress.use(basePath, nestExpress);
	rootExpress.listen(port, () => {
		logger.info(
			new AppStartLoggable({
				appName: 'course export & import service',
				port,
			})
		);
		createAndStartPrometheusMetricsAppIfEnabled(logger);
	});
}
void bootstrap();
