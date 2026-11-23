/* istanbul ignore file */

import { BoardImportWorkerAppModule } from '@modules/board-import/board-import-worker.app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const internalServerExpress = express();
	const internalServerExpressAdapter = new ExpressAdapter(internalServerExpress);

	const nestApp = await NestFactory.create(BoardImportWorkerAppModule, internalServerExpressAdapter);
	await nestApp.init();

	const port = 4456;
	const rootExpress = express();
	rootExpress.use('/internal', internalServerExpress);
	rootExpress.listen(port);

	console.log('#################################');
	console.log(`### Start Board Import Worker ###`);
	console.log('#################################');
}
void bootstrap();
