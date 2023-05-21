/* istanbul ignore file */
// application imports
/* eslint-disable no-console */
import { MikroORM } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { Mail, MailService } from '@shared/infra/mail';
import {
	addPrometheusMetricsMiddlewaresIfEnabled,
	createAndStartPrometheusMetricsServerIfEnabled,
} from '@shared/infra/metrics';
import { LegacyLogger } from '@src/core/logger';
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
import legacyAppPromise = require('../../../../src/app');

async function bootstrap() {
	sourceMapInstall();

	// create the NestJS application on a seperate express instance
	const nestExpress = express();
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(ServerModule, nestExpressAdapter);
	const orm = nestApp.get(MikroORM);

	// WinstonLogger
	const logger = await nestApp.resolve(LegacyLogger);
	nestApp.useLogger(logger);

	// load the legacy feathers/express server
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const feathersExpress = await legacyAppPromise(orm);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	feathersExpress.setup();

	// set reference to legacy app as an express setting so we can
	// access it over the current request within FeathersServiceProvider
	// TODO remove if not needed anymore
	nestExpress.set('feathersApp', feathersExpress);

	// customize nest app settings
	nestApp.enableCors();
	enableOpenApiDocs(nestApp, 'docs');

	await nestApp.init();

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

	// mount instances
	const rootExpress = express();

	addPrometheusMetricsMiddlewaresIfEnabled(logger, rootExpress);

	// exposed alias mounts
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	rootExpress.use('/api/v1', feathersExpress);
	rootExpress.use('/api/v3', nestExpress);
	rootExpress.use(express.static(join(__dirname, '../static-assets')));

	// logger middleware for deprecated paths
	// TODO remove when all calls to the server are migrated
	const logDeprecatedPaths = (req: express.Request, res: express.Response, next: express.NextFunction) => {
		logger.error(req.path, 'DEPRECATED-PATH');
		next();
	};

	// safety net for deprecated paths not beginning with version prefix
	// TODO remove when all calls to the server are migrated
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	rootExpress.use('/api', logDeprecatedPaths, feathersExpress);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	rootExpress.use('/', logDeprecatedPaths, feathersExpress);

	const port = 3030;

	rootExpress.listen(port, () => {
		logger.log(`Main server started on port ${port}`);

		createAndStartPrometheusMetricsServerIfEnabled(logger);
	});

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
