/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { createRequestLoggerMiddleware, LegacyLogger, LOGGER_CONFIG_TOKEN, LoggerConfig } from '@core/logger';
import { H5P_EDITOR_CONFIG_TOKEN, H5PEditorAppModule, H5PEditorConfig } from '@modules/h5p-content-management';
import { enableOpenApiDocs } from './helpers';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	// create the NestJS application on a seperate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);

	const nestApp = await NestFactory.create<NestExpressApplication>(H5PEditorAppModule, nestExpressAdapter);
	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	const loggerConfig = await nestApp.resolve<LoggerConfig>(LOGGER_CONFIG_TOKEN);
	nestApp.use(createRequestLoggerMiddleware(loggerConfig));

	// customize nest app settings
	nestApp.enableCors({ exposedHeaders: ['Content-Disposition'] });
	const h5pEditorConfig = await nestApp.resolve<H5PEditorConfig>(H5P_EDITOR_CONFIG_TOKEN);
	nestApp.useBodyParser('json', { limit: h5pEditorConfig.bodyParserJsonLimit });
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
