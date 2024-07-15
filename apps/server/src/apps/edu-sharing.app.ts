/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { EduSharingApiModule } from '@modules/edu-sharing/edu-sharing-api.module';
import { API_VERSION_PATH } from '@modules/edu-sharing/edu-sharing.const';
import { SwaggerDocumentOptions } from '@nestjs/swagger';
import { LegacyLogger } from '@src/core/logger';
import { enableOpenApiDocs } from '@src/shared/controller/swagger';

async function bootstrap() {
	sourceMapInstall();

	// create the NestJS application on a seperate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(EduSharingApiModule, nestExpressAdapter);

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	// customize nest app settings
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });

	const options: SwaggerDocumentOptions = {
		operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
	};
	enableOpenApiDocs(nestApp, 'docs', options);

	await nestApp.init();

	// mount instances
	const rootExpress = express();

	const port = 4450;
	const basePath = API_VERSION_PATH;

	// exposed alias mounts
	rootExpress.use(basePath, nestExpress);
	rootExpress.listen(port);

	console.log('#################################');
	console.log(`### Start edu-sharing Server  ###`);
	console.log(`### Port:     ${port}            ###`);
	console.log(`### Base path: ${basePath}        ###`);
	console.log('#################################');
}
void bootstrap();
