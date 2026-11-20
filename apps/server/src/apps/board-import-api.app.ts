/* istanbul ignore file */

import { BoardImportApiInternalAppModule } from '@modules/board-import/board-import-api-internal.app.module';
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

	const internalServerExpress = express();
	const internalServerExpressAdapter = new ExpressAdapter(internalServerExpress);
	const internalServerApp = await NestFactory.create(BoardImportApiInternalAppModule, internalServerExpressAdapter);
	await internalServerApp.init();

	const port = 3352;
	const rootExpress = express();
	rootExpress.use('/api/v3', nestExpress);
	rootExpress.use('/internal', internalServerExpress);
	rootExpress.listen(port);

	console.log('##############################');
	console.log(`### Start Board Import API ###`);
	console.log('##############################');
}
void bootstrap();
