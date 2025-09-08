/* istanbul ignore file */
import { LegacyLogger, Logger } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AdminApiServerModule } from '@modules/server/admin-api.server.app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';
import {
	addPrometheusMetricsMiddlewaresIfEnabled,
	AppStartLoggable,
	createAndStartPrometheusMetricsAppIfEnabled,
	enableOpenApiDocs,
} from './helpers';
import { createRequestLoggerMiddleware } from './helpers/request-logger-middleware';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestAdminServerExpress = express();
	const nestAdminServerExpressAdapter = new ExpressAdapter(nestAdminServerExpress);
	nestAdminServerExpressAdapter.disable('x-powered-by');

	const nestAdminServerApp = await NestFactory.create<NestExpressApplication>(
		AdminApiServerModule,
		nestAdminServerExpressAdapter
	);
	const logger = await nestAdminServerApp.resolve(Logger);
	const legacyLogger = await nestAdminServerApp.resolve(LegacyLogger);
	nestAdminServerApp.use(createRequestLoggerMiddleware());

	nestAdminServerApp.useLogger(legacyLogger);
	nestAdminServerApp.enableCors();
	nestAdminServerApp.useBodyParser('json', { limit: '4mb' });

	addPrometheusMetricsMiddlewaresIfEnabled(logger, nestAdminServerExpress);

	enableOpenApiDocs(nestAdminServerApp, 'docs');
	nestAdminServerApp.setGlobalPrefix('/admin/api/v1');

	await nestAdminServerApp.init();

	const adminApiServerPort = Configuration.get('ADMIN_API__PORT') as number;

	nestAdminServerExpress.listen(adminApiServerPort, () => {
		logger.info(
			new AppStartLoggable({
				appName: 'Admin API server app',
				port: adminApiServerPort,
				mountsDescription: `/admin/api/v1 --> Admin API Server`,
			})
		);

		createAndStartPrometheusMetricsAppIfEnabled(logger);
	});
}

void bootstrap();
