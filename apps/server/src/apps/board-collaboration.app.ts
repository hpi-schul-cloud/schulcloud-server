/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { createRequestLoggerMiddleware, LegacyLogger, LoggerConfig } from '@core/logger';
import { LOGGER_CONFIG_TOKEN } from '@core/logger/logger.config';
import { DATABASE_CONFIG_TOKEN, InternalDatabaseConfig } from '@infra/database';
import { MongoIoAdapter } from '@infra/socketio';
import { SESSION_VALKEY_CLIENT } from '@modules/authentication/authentication-config';
import { BoardCollaborationModule } from '@modules/board/board-collaboration.app.module';
import { BOARD_CONFIG_TOKEN, BoardConfig } from '@modules/board/board.config';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerDocumentOptions } from '@nestjs/swagger';
import express from 'express';
import { enableOpenApiDocs } from './helpers';
import { createMetricsServer } from './helpers/metrics.server';
import legacyRedisUtils = require('../../../../src/utils/redis');

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(BoardCollaborationModule, nestExpressAdapter);
	const legacyLogger = await nestApp.resolve(LegacyLogger);
	nestApp.useLogger(legacyLogger);
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });

	const ioAdapter = new MongoIoAdapter(nestApp);
	const dbConfig = await nestApp.resolve<InternalDatabaseConfig>(DATABASE_CONFIG_TOKEN);

	await ioAdapter.connectToMongoDb(dbConfig);

	nestApp.useWebSocketAdapter(ioAdapter);
	legacyLogger.log('Using MongoDB as Socket.IO adapter');

	const options: SwaggerDocumentOptions = {
		operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
	};
	enableOpenApiDocs(nestApp, 'docs', options);
	const loggerConfig = await nestApp.resolve<LoggerConfig>(LOGGER_CONFIG_TOKEN);
	nestApp.use(createRequestLoggerMiddleware(loggerConfig));
	// The redisClient must be initialized in the legacy part for the session handling (whitelisting of JWTs) to work.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const sessionValkeyClient = await nestApp.resolve(SESSION_VALKEY_CLIENT);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	legacyRedisUtils.initializeRedisClient(sessionValkeyClient);

	await createMetricsServer(nestApp, 'Board Collaboration Server App');

	await nestApp.init();

	const boardConfig = await nestApp.resolve<BoardConfig>(BOARD_CONFIG_TOKEN);
	const { basePath } = boardConfig;

	const port = 4450;

	nestApp.setGlobalPrefix(basePath);
	await nestApp.listen(port, () => {});

	console.log('##########################################');
	console.log(`### Start Board Collaboration Server   ###`);
	console.log(`### Port:      ${port}                 ###`);
	console.log(`### Base path: ${basePath}             ###`);
	console.log('##########################################');
}
void bootstrap();
