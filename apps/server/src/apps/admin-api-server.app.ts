/* istanbul ignore file */
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { AppStartLoggable } from '@src/apps/helpers/app-start-loggable';
import { LegacyLogger, Logger } from '@src/core/logger';
import { AdminApiServerModule } from '@src/modules/server/admin-api.server.module';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';
import {
	addPrometheusMetricsMiddlewaresIfEnabled,
	createAndStartPrometheusMetricsAppIfEnabled,
} from './helpers/prometheus-metrics';

async function bootstrap() {
	sourceMapInstall();

	const nestAdminServerExpress = express();
	const nestAdminServerExpressAdapter = new ExpressAdapter(nestAdminServerExpress);
	nestAdminServerExpressAdapter.disable('x-powered-by');

	const nestAdminServerApp = await NestFactory.create(AdminApiServerModule, nestAdminServerExpressAdapter);
	const logger = await nestAdminServerApp.resolve(Logger);
	const legacyLogger = await nestAdminServerApp.resolve(LegacyLogger);
	nestAdminServerApp.useLogger(legacyLogger);
	nestAdminServerApp.enableCors();

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
