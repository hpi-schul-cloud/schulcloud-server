/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { TldrawModule } from '@src/modules/tldraw';
import { Logger } from '@src/core/logger';
import * as WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { AppStartLoggable } from '@src/apps/helpers/app-start-loggable';

async function bootstrap() {
	sourceMapInstall();

	const nestApp = await NestFactory.create(TldrawModule);
	const wss = new WebSocket.Server({ noServer: true });
	nestApp.useWebSocketAdapter(new WsAdapter(wss));
	nestApp.enableCors();
	enableOpenApiDocs(nestApp, 'docs');

	const logger = await nestApp.resolve(Logger);
	await nestApp.init();

	logger.info(
		new AppStartLoggable({
			appName: 'Tldraw server app',
		})
	);
}

void bootstrap();
