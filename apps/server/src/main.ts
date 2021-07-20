import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { ServerModule } from './server.module';
import legacyAppPromise = require('../../../src/app');
import { API_DOCS_PATH, PORT, ROUTE_PREFIX } from './constants';
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
	const appAdapter = new ExpressAdapter(appExpress);
	const app = await NestFactory.create(ServerModule, appAdapter);

	enableOpenApiDocs(app, API_DOCS_PATH);

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
	rootExpress.use(`/${ROUTE_PREFIX}`, appExpress);
	rootExpress.use('/', legacyExpress);

	// additional alias mounts
	rootExpress.use(`/api/${ROUTE_PREFIX}`, appExpress);
	rootExpress.use('/api', legacyExpress);

	rootExpress.listen(PORT);
}
void bootstrap();
