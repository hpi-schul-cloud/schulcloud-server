/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { LegacyLogger, Logger } from '@src/core/logger';
import { CommonCartridgeApiModule } from '@modules/common-cartridge/common-cartridge-api.module';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';
import { createRequestLoggerMiddleware } from './helpers/request-logger-middleware';
import {
	AppStartLoggable,
	enableOpenApiDocs,
	addPrometheusMetricsMiddlewaresIfEnabled,
	createAndStartPrometheusMetricsAppIfEnabled,
} from './helpers';

async function bootstrap() {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(CommonCartridgeApiModule, nestExpressAdapter);
	enableOpenApiDocs(nestApp, 'docs');

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));
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
