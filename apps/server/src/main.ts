import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { ServerModule } from './server.module';
import legacyAppPromise = require('../../../src/app');
import { enableOpenApiDocs } from './shared/controller/swagger';
import { Mail } from './modules/mail/mail.interface';
import { MailService } from './modules/mail/mail.service';

async function bootstrap() {
	sourceMapInstall();

	// load the legacy feathers/express server
	const legacyExpress = await legacyAppPromise;
	// const adapter = new ExpressAdapter(legacyExpress);
	legacyExpress.setup();

	// create the NestJS application on a seperate express instance
	const appExpress = express();

	// set reference to legacy app as an express setting so we can
	// access it over the current request within FeathersServiceProvider
	// TODO remove if not needed anymore
	appExpress.set('feathersApp', legacyExpress);

	const appAdapter = new ExpressAdapter(appExpress);
	const app = await NestFactory.create(ServerModule, appAdapter);

	enableOpenApiDocs(app, 'docs');

	await app.init();

	// provide NestJS mail service to feathers app
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	legacyExpress.services['nest-mail'] = {
		async send(data: Mail): Promise<void> {
			const mailService = app.get(MailService);
			await mailService.send(data);
		},
	};

	// mount instances
	const rootExpress = express();

	// internal mounts
	rootExpress.use('/v1', legacyExpress);
	rootExpress.use('/v3', appExpress);

	// exposed alias mounts
	rootExpress.use('/api/v1', legacyExpress);
	rootExpress.use('/api/v3', appExpress);

	rootExpress.listen(3030);
}
void bootstrap();
