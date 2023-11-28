/* istanbul ignore file */
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { LegacyLogger, Logger } from '@src/core/logger';
import { enableOpenApiDocs } from '@shared/controller/swagger';
import { AppStartLoggable } from '@src/apps/helpers/app-start-loggable';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AdminApiServerModule } from '@src/modules/server/admin-api.server.module';
import { Configuration } from '@hpi-schul-cloud/commons/lib';

async function bootstrap() {
	sourceMapInstall();

	const nestAdminServerExpress = express();
	const nestAdminServerExpressAdapter = new ExpressAdapter(nestAdminServerExpress);
	nestAdminServerExpressAdapter.disable('x-powered-by');
	const nestAdminServerApp = await NestFactory.create(AdminApiServerModule, nestAdminServerExpressAdapter);
	nestAdminServerApp.useLogger(await nestAdminServerApp.resolve(LegacyLogger));
	nestAdminServerApp.enableCors();

	const logger = await nestAdminServerApp.resolve(Logger);
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
	});
}

void bootstrap();
