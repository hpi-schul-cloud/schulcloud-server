/* istanbul ignore file */
/* eslint-disable no-console */
import { createRequestLoggerMiddleware, LegacyLogger, Logger, LOGGER_CONFIG_TOKEN, LoggerConfig } from '@core/logger';
import { CommonCartridgeApiModule } from '@modules/common-cartridge/common-cartridge-api.app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';
import { AppStartLoggable, enableOpenApiDocs } from './helpers';
import { createMetricsServer } from './helpers/metrics.server';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(CommonCartridgeApiModule, nestExpressAdapter);
	enableOpenApiDocs(nestApp, 'docs');

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	await createMetricsServer(nestApp, 'Board Collaboration Server App');

	await nestApp.init();

	const rootExpress = express();
	const logger = await nestApp.resolve(Logger);
	const loggerConfig = await nestApp.resolve<LoggerConfig>(LOGGER_CONFIG_TOKEN);
	nestApp.use(createRequestLoggerMiddleware(loggerConfig));
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
	});
}
void bootstrap();
