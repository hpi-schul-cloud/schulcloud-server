/* istanbul ignore file */
// application imports
/* eslint-disable no-console */
import { MikroORM } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { Mail, MailService } from '@shared/infra/mail';
import { Logger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountValidationService } from '@src/modules/account/services/account.validation.service';
import { AccountUc } from '@src/modules/account/uc/account.uc';
import { CollaborativeStorageUc } from '@src/modules/collaborative-storage/uc/collaborative-storage.uc';
import { RocketChatService } from '@src/modules/rocketchat';
import { ServerModule } from '@src/modules/server';
import express from 'express';
import { join } from 'path';
// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';
import { INestApplication, VersioningType } from '@nestjs/common';
import { FeathersProxyMiddleware } from './feathers-proxy.middleware';
import legacyAppPromise = require('../../../../src/app');

async function bootstrapFeathers(nestApp: INestApplication): Promise<express.Express> {
	// load the legacy feathers/express server
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const orm: MikroORM = nestApp.get(MikroORM);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const feathersExpress = await legacyAppPromise(orm);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	feathersExpress.setup();

	// provide NestJS mail service to feathers app
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	feathersExpress.services['nest-mail'] = {
		send(data: Mail): void {
			const mailService = nestApp.get(MailService);
			mailService.send(data);
		},
	};
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
	feathersExpress.services['nest-rocket-chat'] = nestApp.get(RocketChatService);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
	feathersExpress.services['nest-account-service'] = nestApp.get(AccountService);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
	feathersExpress.services['nest-account-validation-service'] = nestApp.get(AccountValidationService);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
	feathersExpress.services['nest-account-uc'] = nestApp.get(AccountUc);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
	feathersExpress.services['nest-collaborative-storage-uc'] = nestApp.get(CollaborativeStorageUc);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
	feathersExpress.services['nest-orm'] = orm;

	return feathersExpress as express.Express;
}

async function bootstrap() {
	sourceMapInstall();

	const nestExpress = express();
	nestExpress.use(express.static(join(__dirname, '../static-assets')));

	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(ServerModule, nestExpressAdapter);

	// WinstonLogger
	const logger = await nestApp.resolve(Logger);
	nestApp.useLogger(logger);

	// Versioning
	nestApp.enableVersioning({ prefix: 'v', defaultVersion: '3', type: VersioningType.URI }).setGlobalPrefix('/api/');

	// customize nest app settings
	nestApp.enableCors();
	enableOpenApiDocs(nestApp, '/api/v:version/docs');

	const feathersExpress: express.Express = await bootstrapFeathers(nestApp);

	const feathersProxyMiddleware = new FeathersProxyMiddleware(feathersExpress);
	nestApp.use(feathersProxyMiddleware.use.bind(feathersProxyMiddleware));

	// set reference to legacy app as an express setting so we can
	// access it over the current request within FeathersServiceProvider
	// TODO remove if not needed anymore
	nestExpress.set('feathersApp', feathersExpress);

	await nestApp.init();

	const port = 3030;
	nestExpress.listen(port);

	console.log('#################################');
	console.log(`### Start Server              ###`);
	console.log(`### Port: ${port}             ###`);
	console.log(`### Mounts                    ###`);
	console.log(`### /api/v1   --> feathers    ###`);
	console.log(`### /api/v2   --> feathers    ###`);
	console.log(`### /api/v3-9 --> nest        ###`);
	console.log(`### /api      --> feathers    ###`);
	console.log(`### /         --> feathers    ###`);
	console.log('#################################');
}
void bootstrap();
