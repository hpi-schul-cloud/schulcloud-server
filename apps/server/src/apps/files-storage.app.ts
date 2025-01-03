/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { FilesStorageApiModule } from '@modules/files-storage/files-storage-api.module';
import { API_VERSION_PATH } from '@modules/files-storage/files-storage.const';
import { SwaggerDocumentOptions } from '@nestjs/swagger';
import { LegacyLogger } from '@src/core/logger';
import { createRequestLoggerMiddleware } from './helpers/request-logger-middleware';
import { enableOpenApiDocs } from './helpers';

async function bootstrap() {
	sourceMapInstall();

	// create the NestJS application on a seperate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(FilesStorageApiModule, nestExpressAdapter);

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	// customize nest app settings
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });
	nestApp.use(createRequestLoggerMiddleware());

	const options: SwaggerDocumentOptions = {
		operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
	};
	enableOpenApiDocs(nestApp, 'docs', options);

	await nestApp.init();

	// mount instances
	const rootExpress = express();

	const port = 4444;
	const basePath = API_VERSION_PATH;

	// exposed alias mounts
	rootExpress.use(basePath, nestExpress);
	rootExpress.listen(port);

	console.log('#################################');
	console.log(`### Start Files Storage Server   ###`);
	console.log(`### Port:     ${port}            ###`);
	console.log(`### Base path: ${basePath}           ###`);
	console.log('#################################');
}
void bootstrap();
