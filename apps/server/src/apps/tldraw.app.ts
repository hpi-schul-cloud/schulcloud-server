/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { TldrawModule, TldrawWsModule } from '@src/modules/tldraw';
import { LegacyLogger, Logger } from '@src/core/logger';
import * as WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { AppStartLoggable } from '@src/apps/helpers/app-start-loggable';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

async function bootstrap() {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(TldrawModule, nestExpressAdapter);
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));
	nestApp.enableCors();

	const nestAppWS = await NestFactory.create(TldrawWsModule);
	const wss = new WebSocket.Server({ noServer: true });
	nestAppWS.useWebSocketAdapter(new WsAdapter(wss));
	nestAppWS.enableCors();
	enableOpenApiDocs(nestAppWS, 'docs');
	const logger = await nestAppWS.resolve(Logger);

	await nestAppWS.init();
	await nestApp.init();

	// mount instances
	const rootExpress = express();

	const port = 3349;
	const basePath = '/api/v3';

	// exposed alias mounts
	rootExpress.use(basePath, nestExpress);
	rootExpress.listen(port);

	logger.info(
		new AppStartLoggable({
			appName: 'Tldraw server app',
		})
	);
}

void bootstrap();
