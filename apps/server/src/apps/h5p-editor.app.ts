/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

import path from 'node:path';

// application imports
import { LegacyLogger } from '@src/core/logger';
import { H5PEditorModule } from '@src/modules/h5p-editor';
import { enableOpenApiDocs } from '@src/shared/controller/swagger';

async function bootstrap() {
	sourceMapInstall();

	// create the NestJS application on a seperate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);

	const oneHourInMs = 1000 * 60 * 60;

	nestExpressAdapter.useStaticAssets(path.join(__dirname, '../static-assets/h5p'), {
		prefix: '/h5p-editor',
		maxAge: oneHourInMs,
	});

	const nestApp = await NestFactory.create(H5PEditorModule, nestExpressAdapter);
	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	// customize nest app settings
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });
	enableOpenApiDocs(nestApp, 'docs');

	await nestApp.init();

	// mount instances
	const rootExpress = express();

	const port = 4448;
	const basePath = '/api/v3';

	// exposed alias mounts
	rootExpress.use(basePath, nestExpress);
	rootExpress.listen(port);

	console.log('##########################################');
	console.log(`### Start H5P Editor Server            ###`);
	console.log(`### Port:      ${port}                    ###`);
	console.log(`### Base path: ${basePath}                 ###`);
	console.log('##########################################');
}

void bootstrap();
