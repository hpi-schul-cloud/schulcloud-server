/* istanbul ignore file */

import {
	createRequestLoggerMiddleware,
	LegacyLogger,
	Logger,
	LOGGER_CONFIG_TOKEN,
	type LoggerConfig,
} from '@infra/logger';
import { BoardImportApiInternalAppModule } from '@modules/board-import/board-import-api-internal.app.module';
import { BoardImportApiAppModule } from '@modules/board-import/board-import-api.app.module';
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
	const nestApp = await NestFactory.create(BoardImportApiAppModule, nestExpressAdapter);
	enableOpenApiDocs(nestApp, 'docs');

	nestApp.useLogger(await nestApp.resolve(LegacyLogger));
	const logger = await nestApp.resolve(Logger);

	await createMetricsServer(nestApp, 'Board Import API App');

	const loggerConfig = await nestApp.resolve<LoggerConfig>(LOGGER_CONFIG_TOKEN);
	nestApp.use(createRequestLoggerMiddleware(loggerConfig));

	await nestApp.init();

	const internalServerExpress = express();
	const internalServerExpressAdapter = new ExpressAdapter(internalServerExpress);
	const internalServerApp = await NestFactory.create(BoardImportApiInternalAppModule, internalServerExpressAdapter);
	await internalServerApp.init();

	const basePath = '/api/v3';
	const port = 3352;
	const rootExpress = express();
	rootExpress.use(basePath, nestExpress);
	rootExpress.use('/internal', internalServerExpress);
	rootExpress.listen(port, () => {
		logger.info(
			new AppStartLoggable({
				appName: 'Board import API',
				port,
				basePath,
			})
		);
	});
}
void bootstrap();
