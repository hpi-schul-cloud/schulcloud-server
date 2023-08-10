/* istanbul ignore file */
/* eslint-disable no-console */
// eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { TldrawModule } from '@src/modules/tldraw';
import { AppStartLoggable } from '@src/apps/helpers/app-start-loggable';
import { Logger } from '@src/core/logger';
import * as WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
	sourceMapInstall();
	const nestApp = await NestFactory.create(TldrawModule);
	const wss = new WebSocket.Server({ noServer: true });
	const logger = await nestApp.resolve(Logger);
	nestApp.useWebSocketAdapter(new WsAdapter(wss));
	nestApp.enableCors();
	await nestApp.init();

	logger.log(
		new AppStartLoggable({
			appName: 'Tldraw server app.',
			port: 3345,
		})
	);
}

void bootstrap();
