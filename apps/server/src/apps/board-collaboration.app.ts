/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { RedisIoAdapter } from '@infra/socketio';
import { BoardCollaborationModule } from '@modules/board/board-collaboration.app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerDocumentOptions } from '@nestjs/swagger';
import { LegacyLogger, Logger } from '@src/core/logger';
import express from 'express';
import {
	addPrometheusMetricsMiddlewaresIfEnabled,
	createAndStartPrometheusMetricsAppIfEnabled,
	enableOpenApiDocs,
} from './helpers';
import { createRequestLoggerMiddleware } from './helpers/request-logger-middleware';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(BoardCollaborationModule, nestExpressAdapter);
	const legacyLogger = await nestApp.resolve(LegacyLogger);
	nestApp.useLogger(legacyLogger);
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });

	const ioAdapter = new RedisIoAdapter(nestApp);
	ioAdapter.connectToRedis();
	nestApp.useWebSocketAdapter(ioAdapter);

	const options: SwaggerDocumentOptions = {
		operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
	};
	enableOpenApiDocs(nestApp, 'docs', options);
	const logger = await nestApp.resolve(Logger);
	nestApp.use(createRequestLoggerMiddleware());

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
