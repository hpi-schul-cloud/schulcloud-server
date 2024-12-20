/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { LegacyLogger } from '@src/core/logger';
import { ManagementServerModule } from '@modules/management';
import { createRequestLoggerMiddleware } from './helpers/request-logger-middleware';
import { enableOpenApiDocs } from './helpers';

async function bootstrap() {
	sourceMapInstall();

	// create the NestJS application on a separate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(ManagementServerModule, nestExpressAdapter);

	nestApp.use(createRequestLoggerMiddleware());

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	// customize nest app settings
	nestApp.enableCors();
	enableOpenApiDocs(nestApp, 'docs');

	await nestApp.init();

	// mount instances
	const rootExpress = express();

	const port = 3333;
	const basePath = '/api';

	// exposed alias mounts
	rootExpress.use(basePath, nestExpress);
	rootExpress.listen(port);

	console.log('#################################');
	console.log(`### Start Management Server   ###`);
	console.log(`### Port:     ${port}            ###`);
	console.log(`### Base path: ${basePath}           ###`);
	console.log('#################################');
}
void bootstrap();
