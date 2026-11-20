/* istanbul ignore file */

import { LegacyLogger, Logger } from '@infra/logger';
import { BoardImportWorkerAppModule } from '@modules/board-import/board-import-worker.app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';
import { AppStartLoggable } from './helpers';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const internalServerExpress = express();
	const internalServerExpressAdapter = new ExpressAdapter(internalServerExpress);

	const nestApp = await NestFactory.create(BoardImportWorkerAppModule, internalServerExpressAdapter);
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));
	const logger = await nestApp.resolve(Logger);

	await nestApp.init();

	const basePath = '/internal';
	const port = 4456;
	const rootExpress = express();

	rootExpress.use(basePath, internalServerExpress);
	rootExpress.listen(port, () => {
		logger.info(
			new AppStartLoggable({
				appName: 'Board import worker',
				port,
				basePath,
			})
		);
	});
}
void bootstrap();
