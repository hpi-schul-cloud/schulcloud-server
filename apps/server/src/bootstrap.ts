/* eslint-disable no-console */
/* istanbul ignore file */
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { Logger } from '@nestjs/common';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { ServerModule } from './server.module';
import legacyAppPromise = require('../../../src/app');
import { Mail } from './modules/mail/mail.interface';
import { MailService } from './modules/mail/mail.service';
import { ManagementModule } from './modules/management/management.module';

export async function bootstrap(module: ServerModule | ManagementModule, port: number): Promise<void> {
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
	const nestApp = await NestFactory.create(module, nestExpressAdapter);

	// customize nest app settings
	nestApp.enableCors();
	enableOpenApiDocs(nestApp, 'docs');

	await nestApp.init();

	// mount instances
	const rootExpress = express();

	const moduleName = (module as unknown as { name: string }).name;

	switch (moduleName) {
		case ServerModule.name:
			// start default server module
			console.log('####################################');
			console.log(`### Start Server on port ${port}    ###`);
			console.log('####################################');

			// provide NestJS mail service to feathers app
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			feathersExpress.services['nest-mail'] = {
				async send(data: Mail): Promise<void> {
					const mailService = nestApp.get(MailService);
					await mailService.send(data);
				},
			};

			// exposed alias mounts
			rootExpress.use('/api/v1', feathersExpress);
			rootExpress.use('/api/v3', nestExpress);

			// logger middleware for deprecated paths
			// TODO remove when all calls to the server are migrated
			// eslint-disable-next-line no-case-declarations
			const logDeprecatedPaths = (req: express.Request, res: express.Response, next: express.NextFunction) => {
				Logger.error(req.path, undefined, 'DEPRECATED-PATH');
				next();
			};

			// safety net for deprecated paths not beginning with version prefix
			// TODO remove when all calls to the server are migrated
			rootExpress.use('/api', logDeprecatedPaths, feathersExpress);
			rootExpress.use('/', logDeprecatedPaths, feathersExpress);
			break;
		case ManagementModule.name:
			// start management module only
			console.log('###############################################');
			console.log(`### Start Server Management on port ${port}    ###`);
			console.log('###############################################');
			rootExpress.use('/api', nestExpress);
			break;
		default:
			throw new Error('unknown start module');
	}

	rootExpress.listen(port);
}
