/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { ManagementModule } from './modules/management/management.module';
import { enableOpenApiDocs } from './shared/controller/swagger';

async function bootstrap() {
	sourceMapInstall();

	// create the NestJS application on a seperate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(ManagementModule, nestExpressAdapter);

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
