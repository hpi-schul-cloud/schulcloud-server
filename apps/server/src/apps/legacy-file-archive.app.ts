/* istanbul ignore file */
/* eslint-disable no-console */
import { createRequestLoggerMiddleware, LegacyLogger, Logger, LOGGER_CONFIG_TOKEN, LoggerConfig } from '@core/logger';
import { LegacyFileArchiveApiModule } from '@modules/files';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';
import { AppStartLoggable } from './helpers';
import { createMetricsServer } from './helpers/metrics.server';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(LegacyFileArchiveApiModule, nestExpressAdapter);

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	const config = new DocumentBuilder()
		.addServer('/api/v1/') // add default path as server to have correct urls ald let 'try out' work
		.setTitle('Schulcloud-Verbund-Software Server API')
		.setDescription('This is v1 of Legacy File Archive Server.')
		.setVersion('1.0')
		/** set authentication for all routes enabled by default */
		.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
		.build();
	const document = SwaggerModule.createDocument(nestApp, config);
	SwaggerModule.setup('/filestorage/files/archive/docs', nestApp, document);

	await createMetricsServer(nestApp, 'Legacy File Archive Download App');

	await nestApp.init();

	const rootExpress = express();
	const logger = await nestApp.resolve(Logger);
	const loggerConfig = await nestApp.resolve<LoggerConfig>(LOGGER_CONFIG_TOKEN);
	nestApp.use(createRequestLoggerMiddleware(loggerConfig));
	const basePath = '/api/v1';
	const port = 3351;

	rootExpress.use(basePath, nestExpress);
	rootExpress.listen(port, () => {
		logger.info(
			new AppStartLoggable({
				appName: 'Legacy File Archive Download App',
				port,
			})
		);
	});
}
void bootstrap();
