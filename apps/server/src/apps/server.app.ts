/* istanbul ignore file */

import { Mail, MailService } from '@infra/mail';
// application imports

import { createRequestLoggerMiddleware, LegacyLogger, Logger, LOGGER_CONFIG_TOKEN, LoggerConfig } from '@core/logger';
import { MikroORM } from '@mikro-orm/core';
import { AccountService } from '@modules/account';
import { AccountUc } from '@modules/account/api/account.uc';
import { SystemRule } from '@modules/authorization-rules';
import { ColumnBoardService } from '@modules/board';
import { CollaborativeStorageUc } from '@modules/collaborative-storage/uc/collaborative-storage.uc';
import { GroupService } from '@modules/group';
import { InternalServerModule } from '@modules/internal-server/internal-server.app.module';
import { FeathersRosterService } from '@modules/roster';
import { ServerModule } from '@modules/server/server.app.module';
import { TeamService } from '@modules/team';
import { ContextExternalToolService } from '@modules/tool/context-external-tool';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { join } from 'path';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';
import { AppStartLoggable, enableOpenApiDocs } from './helpers';
import { createMetricsServer } from './helpers/metrics.server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import legacyAppPromise = require('../../../../src/app');
import { JWT_WHITELIST_VALKEY_CLIENT } from '@infra/jwt-whitelist';

type LegacyFeathersApp = {
	setup: () => Promise<void>;
	services: Record<string, unknown>;
};

type LegacyAppFactory = (orm: MikroORM, cacheManager: unknown) => Promise<LegacyFeathersApp>;

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	// create the NestJS application on a separate express instance
	const nestExpress = express();
	// See: https://docs.nestjs.com/migration-guide#query-parameters-parsing
	nestExpress.set('query parser', 'extended');
	const nestExpressAdapter = new ExpressAdapter(nestExpress);
	const nestApp = await NestFactory.create(ServerModule, nestExpressAdapter);
	const orm = nestApp.get(MikroORM);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const cacheManager = await nestApp.resolve(JWT_WHITELIST_VALKEY_CLIENT);

	// WinstonLogger
	const legacyLogger = await nestApp.resolve(LegacyLogger);
	nestApp.useLogger(legacyLogger);

	const logger = await nestApp.resolve(Logger);
	const loggerConfig = await nestApp.resolve<LoggerConfig>(LOGGER_CONFIG_TOKEN);
	nestApp.use(createRequestLoggerMiddleware(loggerConfig));
	// load the legacy feathers/express server
	const createLegacyApp = legacyAppPromise as LegacyAppFactory;
	const feathersExpress = await createLegacyApp(orm, cacheManager);
	await feathersExpress.setup();

	// set reference to legacy app as an express setting so we can
	// access it over the current request within FeathersServiceProvider
	// TODO remove if not needed anymore
	nestExpress.set('feathersApp', feathersExpress);

	// customize nest app settings
	nestApp.enableCors();
	enableOpenApiDocs(nestApp, 'docs');

	await createMetricsServer(nestApp, 'Schulcloud Server App');

	await nestApp.init();

	// create the internal server module on a separate express instance
	const internalServerExpress = express();
	const internalServerExpressAdapter = new ExpressAdapter(internalServerExpress);
	const internalServerApp = await NestFactory.create(InternalServerModule, internalServerExpressAdapter);
	await internalServerApp.init();

	// provide NestJS mail service to feathers app

	feathersExpress.services['nest-mail'] = {
		async send(data: Mail): Promise<void> {
			const mailService = nestApp.get(MailService);
			await mailService.send(data);
		},
	};

	feathersExpress.services['nest-account-service'] = nestApp.get(AccountService);

	feathersExpress.services['nest-account-uc'] = nestApp.get(AccountUc);

	feathersExpress.services['nest-collaborative-storage-uc'] = nestApp.get(CollaborativeStorageUc);

	feathersExpress.services['nest-team-service'] = nestApp.get(TeamService);

	feathersExpress.services['nest-feathers-roster-service'] = nestApp.get(FeathersRosterService);

	feathersExpress.services['nest-group-service'] = nestApp.get(GroupService);

	feathersExpress.services['nest-column-board-service'] = nestApp.get(ColumnBoardService);

	feathersExpress.services['nest-context-external-tool-service'] = nestApp.get(ContextExternalToolService);

	feathersExpress.services['nest-system-rule'] = nestApp.get(SystemRule);

	feathersExpress.services['nest-orm'] = orm;

	// mount instances
	const rootExpress = express();

	// exposed alias mounts

	rootExpress.use('/api/v1', feathersExpress);
	rootExpress.use('/api/v3', nestExpress);
	rootExpress.use('/internal', internalServerExpress);
	rootExpress.use(express.static(join(__dirname, '../static-assets')));

	// logger middleware for deprecated paths
	// TODO remove when all calls to the server are migrated
	const logDeprecatedPaths = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
		legacyLogger.error(req.path, 'DEPRECATED-PATH');
		next();
	};

	// safety net for deprecated paths not beginning with version prefix
	// TODO remove when all calls to the server are migrated

	rootExpress.use('/api', logDeprecatedPaths, feathersExpress);

	rootExpress.use('/', logDeprecatedPaths, feathersExpress);

	const port = 3030;

	rootExpress.listen(port, () => {
		logger.info(
			new AppStartLoggable({
				appName: 'Main server app',
				port,
				mountsDescription: '/, /api, /api/v1 --> FeathersJS, /api/v3 --> NestJS',
			})
		);
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
