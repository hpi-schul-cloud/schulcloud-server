/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';

import { createRequestLoggerMiddleware, LegacyLogger, LOGGER_CONFIG_TOKEN, LoggerConfig } from '@core/logger';
import { MikroORM } from '@mikro-orm/core';
import { ManagementServerModule } from '@modules/management/management-server.app.module';
import { install as sourceMapInstall } from 'source-map-support';
import { enableOpenApiDocs } from './helpers';
import legacyAppPromise = require('../../../../src/app');

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	// create the NestJS application on a separate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp: NestExpressApplication = await NestFactory.create(ManagementServerModule, nestExpressAdapter);
	const orm = nestApp.get(MikroORM);

	nestApp.useBodyParser('text');

	const loggerConfig = await nestApp.resolve<LoggerConfig>(LOGGER_CONFIG_TOKEN);
	nestApp.use(createRequestLoggerMiddleware(loggerConfig));

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	// load the legacy feathers/express server
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const feathersExpress = await legacyAppPromise(orm);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	await feathersExpress.setup();

	// set reference to legacy app as an express setting so we can
	// access it over the current request within FeathersServiceProvider
	// TODO remove if not needed anymore, needed for legacy indexes
	nestExpress.set('feathersApp', feathersExpress);

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
	console.log(`### Port:     ${port}         ###`);
	console.log(`### Base path: ${basePath}    ###`);
	console.log('#################################');
}
void bootstrap();
