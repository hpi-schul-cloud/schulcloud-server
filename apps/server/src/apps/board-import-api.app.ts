/* istanbul ignore file */

import { BoardImportApiAppModule } from '@modules/board-import/board-import-api.app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';
import { enableOpenApiDocs } from './helpers';
import { createMetricsServer } from './helpers/metrics.server';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(BoardImportApiAppModule, nestExpressAdapter);
	enableOpenApiDocs(nestApp, 'docs');

	await createMetricsServer(nestApp, 'Board Import API App');

	await nestApp.init();

	const port = 3352;
	const rootExpress = express();
	rootExpress.use('/api/v3', nestExpress);
	rootExpress.listen(port);

	console.log('##############################');
	console.log(`### Start Board Import API ###`);
	console.log('##############################');
}
void bootstrap();
