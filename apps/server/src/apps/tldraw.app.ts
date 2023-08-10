/* istanbul ignore file */
/* eslint-disable no-console */
// eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { TldrawModule } from '@src/modules/tldraw';
import { AppStartLoggable } from '@src/apps/helpers/app-start-loggable';
import { LegacyLogger, Logger } from '@src/core/logger';
import * as WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import { enableOpenApiDocs } from '@shared/controller/swagger';

async function bootstrap() {
	sourceMapInstall();
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(TldrawModule, nestExpressAdapter);

	const wss = new WebSocket.Server({ noServer: true });
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));
	const logger = await nestApp.resolve(Logger);
	nestApp.useWebSocketAdapter(new WsAdapter(wss));
	nestApp.enableCors();
	enableOpenApiDocs(nestApp, 'docs');
	await nestApp.init();

	const rootExpress = express();
	const port = 4449;

	rootExpress.use('/', nestExpress);
	rootExpress.listen(port, () => {
		logger.log(
			new AppStartLoggable({
				appName: 'Tldraw server app',
				port: 3345,
			})
		);
	});

	// console.log('##########################################');
	// console.log(`### Tldraw Server            			###`);
	// console.log(`### Port: ${port}                    	###`);
	// console.log('##########################################');
}

void bootstrap();
