/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { SwaggerDocumentOptions } from '@nestjs/swagger';
// import { DB_URL } from '@src/config';
import { LegacyLogger, Logger } from '@src/core/logger';
import { MongoIoAdapter, RedisIoAdapter } from '@src/infra/socketio';
import { BoardCollaborationModule } from '@src/modules/board/board-collaboration.module';
import { enableOpenApiDocs } from '@src/shared/controller/swagger';
import express from 'express';
import {
	addPrometheusMetricsMiddlewaresIfEnabled,
	createAndStartPrometheusMetricsAppIfEnabled,
} from '@src/apps/helpers/prometheus-metrics';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DB_URL } from '@src/config';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(BoardCollaborationModule, nestExpressAdapter);
	const legacyLogger = await nestApp.resolve(LegacyLogger);
	nestApp.useLogger(legacyLogger);
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });

	let ioAdapter: IoAdapter;
	// eslint-disable-next-line no-process-env
	if (process.env.COLLABORATION_WEBSOCKET_ADAPTER === 'redis') {
		ioAdapter = new RedisIoAdapter(nestApp);
	} else {
		const mongoAdapter = new MongoIoAdapter(nestApp);
		await mongoAdapter.connectToMongoDb(DB_URL);
		ioAdapter = mongoAdapter;
	}
	nestApp.useWebSocketAdapter(ioAdapter);

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
