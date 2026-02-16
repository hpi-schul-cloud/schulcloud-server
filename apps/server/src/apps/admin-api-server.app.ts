/* istanbul ignore file */
import { createRequestLoggerMiddleware, LegacyLogger, Logger, LOGGER_CONFIG_TOKEN, LoggerConfig } from '@core/logger';
import { ADMIN_API_SERVER_CONFIG_TOKEN, AdminApiServerConfig } from '@modules/server/admin-api-server.config';
import { AdminApiServerModule } from '@modules/server/admin-api.server.app.module';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express from 'express';
import { install as sourceMapInstall } from 'source-map-support';
import { AppStartLoggable, enableOpenApiDocs } from './helpers';
import { createMetricsServer } from './helpers/metrics.server';

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
	const loggerConfig = await nestAdminServerApp.resolve<LoggerConfig>(LOGGER_CONFIG_TOKEN);
	nestAdminServerApp.use(createRequestLoggerMiddleware(loggerConfig));

	nestAdminServerApp.useLogger(legacyLogger);
	nestAdminServerApp.enableCors();
	nestAdminServerApp.useBodyParser('json', { limit: '4mb' });

	enableOpenApiDocs(nestAdminServerApp, 'docs');
	nestAdminServerApp.setGlobalPrefix('/admin/api/v1');

	await createMetricsServer(nestAdminServerApp, 'Admin API Server App');

	await nestAdminServerApp.init();

	const adminApiServerConfig = await nestAdminServerApp.resolve<AdminApiServerConfig>(ADMIN_API_SERVER_CONFIG_TOKEN);

	const adminApiServerPort = adminApiServerConfig.port;

	nestAdminServerExpress.listen(adminApiServerPort, () => {
		logger.info(
			new AppStartLoggable({
				appName: 'Admin API server app',
				port: adminApiServerPort,
				mountsDescription: `/admin/api/v1 --> Admin API Server`,
			})
		);
	});
}

void bootstrap();
