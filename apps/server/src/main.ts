import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { Logger } from '@nestjs/common';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ServerModule } from './server.module';
import legacyAppPromise = require('../../../src/app');
import { enableOpenApiDocs } from './shared/controller/swagger';
import { Mail } from './modules/mail/mail.interface';
import { MailService } from './modules/mail/mail.service';
import { ServerAndManagementModule } from './server-and-management.module';

async function bootstrap(module: ServerModule | ServerAndManagementModule, port: number) {
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

	// provide NestJS mail service to feathers app
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	feathersExpress.services['nest-mail'] = {
		async send(data: Mail): Promise<void> {
			const mailService = nestApp.get(MailService);
			await mailService.send(data);
		},
	};

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

	rootExpress.listen(port);
}

if (Configuration.get('ENABLE_MANAGEMENT_API') === true) {
	// start management api
	console.warn('######################################################################');
	console.warn('#####   ENABLE_MANAGEMENT_API has been set true                  #####');
	console.warn('#####   start server management module on port 3333              #####');
	console.warn('#####   DO NOT USE IN PRODUCTION!                                #####');
	console.warn('######################################################################');
	void bootstrap(ServerAndManagementModule, 3333);
} else {
	// start default application
	console.log('######################################################################');
	console.log('#####   start server module on port 3030                         #####');
	console.log('######################################################################');
	void bootstrap(ServerModule, 3030);
}
