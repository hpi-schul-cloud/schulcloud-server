/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { TldrawApiModule } from '@modules/tldraw/tldraw-api.module';
import { TldrawWsModule } from '@modules/tldraw/tldraw-ws.module';
import { LegacyLogger, Logger } from '@src/core/logger';
import * as WebSocket from 'ws';
import { WsAdapter } from '@nestjs/platform-ws';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { AppStartLoggable } from '@src/apps/helpers/app-start-loggable';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import {
	addPrometheusMetricsMiddlewaresIfEnabled,
	createAndStartPrometheusMetricsAppIfEnabled,
} from '@src/apps/helpers/prometheus-metrics';

async function bootstrap() {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(TldrawApiModule, nestExpressAdapter);
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

	addPrometheusMetricsMiddlewaresIfEnabled(logger, rootExpress);
	const port = 3349;
	const basePath = '/api/v3';

	// exposed alias mounts
	rootExpress.use(basePath, nestExpress);

	rootExpress.listen(port, () => {
		logger.info(
			new AppStartLoggable({
				appName: 'Tldraw server app',
				port,
			})
		);

		createAndStartPrometheusMetricsAppIfEnabled(logger);
	});
}

void bootstrap();
