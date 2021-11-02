/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { Logger } from '@nestjs/common';
import { MailService, Mail } from '@shared/infra/mail';
import { RocketChatService } from '@src/modules/rocketchat';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { ServerModule } from './server.module';
import legacyAppPromise = require('../../../src/app');

async function bootstrap() {
	sourceMapInstall();

	// load the legacy feathers/express server
	const feathersExpress = await legacyAppPromise;
	feathersExpress.setup();

	// create the NestJS application on a seperate express instance
	const nestExpress = express();

	// set reference to legacy app as an express setting so we can
	// access it over the current request within FeathersServiceProvider
	// TODO remove if not needed anymore
	nestExpress.set('feathersApp', feathersExpress);

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(ServerModule, nestExpressAdapter);

	// customize nest app settings
	nestApp.enableCors();
	enableOpenApiDocs(nestApp, 'docs');

	await nestApp.init();

	// provide NestJS mail service to feathers app
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	feathersExpress.services['nest-mail'] = {
		async send(data: Mail): Promise<void> {
			const mailService = nestApp.get(MailService);
			await mailService.send(data);
		},
	};
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
	feathersExpress.services['nest-rocket-chat'] = nestApp.get(RocketChatService);

	// mount instances
	const rootExpress = express();

	// exposed alias mounts
	rootExpress.use('/api/v1', feathersExpress);
	rootExpress.use('/api/v3', nestExpress);

	// logger middleware for deprecated paths
	// TODO remove when all calls to the server are migrated
	const logDeprecatedPaths = (req: express.Request, res: express.Response, next: express.NextFunction) => {
		Logger.error(req.path, undefined, 'DEPRECATED-PATH');
		next();
	};

	// safety net for deprecated paths not beginning with version prefix
	// TODO remove when all calls to the server are migrated
	rootExpress.use('/api', logDeprecatedPaths, feathersExpress);
	rootExpress.use('/', logDeprecatedPaths, feathersExpress);

	const port = 3030;
	rootExpress.listen(port);

	console.log('#################################');
	console.log(`### Start Server              ###`);
	console.log(`### Port: ${port}                ###`);
	console.log(`### Mounts                    ###`);
	console.log(`### /api/v1 --> feathers      ###`);
	console.log(`### /api/v3 --> nest          ###`);
	console.log(`### /api    --> feathers      ###`);
	console.log(`### /       --> feathers      ###`);
	console.log('#################################');
}
void bootstrap();
