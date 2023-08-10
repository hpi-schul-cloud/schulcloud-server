/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { TldrawModule } from '@src/modules/tldraw';
import { LegacyLogger } from '@src/core/logger';
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
	nestApp.useWebSocketAdapter(new WsAdapter(wss));
	nestApp.enableCors();
	enableOpenApiDocs(nestApp, 'docs');
	await nestApp.init();

	const rootExpress = express();
	const basePath = '/';
	const port = 4449;

	rootExpress.use(basePath, nestExpress);
	rootExpress.listen(port);

	console.log('##########################################');
	console.log(`### Tldraw Server            			###`);
	console.log(`### App Port: ${port}                  ###`);
	console.log(`### WebSocket Gateway Port: ${3345}    ###`);
	console.log('##########################################');
}

void bootstrap();
