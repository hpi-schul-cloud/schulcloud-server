/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { Logger } from '@src/core/logger';
import { ManagementServerModule } from '@src/modules/management';
import { enableOpenApiDocs } from '@src/shared/controller/swagger';
import { EntityManager } from '@mikro-orm/mongodb';

async function bootstrap() {
	sourceMapInstall();

	// create the NestJS application on a seperate express instance
	const nestExpress = express();

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(ManagementServerModule, nestExpressAdapter);

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(Logger));

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

	// https://www.mongodb.com/docs/drivers/node/v4.4/fundamentals/monitoring/cluster-monitoring/
	const em = nestApp.get(EntityManager);
	const client = em.getConnection('write').getClient();
	const eventNames = [
		'serverOpening',
		'serverClosed',
		'serverDescriptionChanged',
		'topologyOpening',
		'topologyClosed',
		'topologyDescriptionChanged',
		'serverHeartbeatStarted',
		'serverHeartbeatSucceeded',
		'serverHeartbeatFailed',
	];
	for (const eventName of eventNames) {
		console.log(`registering event listener for ${eventName}`);
		client.on(eventName, (event) => {
			console.log(`XXXXreceived ${eventName}: ${JSON.stringify(event, null, 2)}`);
		});
	}
}
void bootstrap();
