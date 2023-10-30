/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { ManagementServerModule } from '@src/modules/management/management-server.module';
import express from 'express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports

async function bootstrap() {
	sourceMapInstall();

	// create the NestJS application on a seperate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(ManagementServerModule, nestExpressAdapter);

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
