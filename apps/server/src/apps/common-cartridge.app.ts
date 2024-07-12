/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { AppStartLoggable } from '@src/apps/helpers/app-start-loggable';
import {
	addPrometheusMetricsMiddlewaresIfEnabled,
	createAndStartPrometheusMetricsAppIfEnabled,
} from '@src/apps/helpers/prometheus-metrics';
import { DB_URL } from '@src/config';
import { LegacyLogger, Logger } from '@src/core/logger';
import { RabbitMqURI } from '@src/infra/rabbitmq';
import { CommonCartridgeApiModule } from '@src/modules/common-cartridge/common-cartridge-api.module';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';

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

	addPrometheusMetricsMiddlewaresIfEnabled(logger, rootExpress);

	const basePath = '/api/v3';
	const port = 3350;

	console.log('#########################################');
	console.log(`RABBITMQ_URI: ${RabbitMqURI}`);
	console.log(`MONGO_URI: ${DB_URL}`);
	console.log('#########################################');

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
