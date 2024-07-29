/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { SwaggerDocumentOptions } from '@nestjs/swagger';
import { LegacyLogger, Logger } from '@src/core/logger';
// import { MongoIoAdapter } from '@src/infra/socketio';
import { RedisIoAdapter } from '@src/infra/socketio';
import { BoardCollaborationModule } from '@src/modules/board/board-collaboration.module';
import { enableOpenApiDocs } from '@src/shared/controller/swagger';
import express from 'express';
import {
	addPrometheusMetricsMiddlewaresIfEnabled,
	createAndStartPrometheusMetricsAppIfEnabled,
} from '@src/apps/helpers/prometheus-metrics';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(BoardCollaborationModule, nestExpressAdapter);
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });

	const redisIoAdapter = new RedisIoAdapter(nestApp);
	nestApp.useWebSocketAdapter(redisIoAdapter);

	const options: SwaggerDocumentOptions = {
		operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
	};
	enableOpenApiDocs(nestApp, 'docs', options);
	const logger = await nestApp.resolve(Logger);

	await nestApp.init();

	addPrometheusMetricsMiddlewaresIfEnabled(logger, nestExpress);
	const port = 4450;
	const basePath = '/board-collaboration';

	nestApp.setGlobalPrefix(basePath);
	await nestApp.listen(port, () => {
		createAndStartPrometheusMetricsAppIfEnabled(logger);
	});

	console.log('##########################################');
	console.log(`### Start Board Collaboration Server   ###`);
	console.log(`### Port:      ${port}                 ###`);
	console.log(`### Base path: ${basePath}             ###`);
	console.log('##########################################');
}
void bootstrap();
