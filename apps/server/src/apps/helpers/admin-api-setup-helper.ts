import express from 'express';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Logger } from '@src/core/logger';
import { AdminApiServerModule } from '@src/modules/server/admin-api.server.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { AppStartLoggable } from './app-start-loggable';

export const createAndStartAdminApiServer = async (logger: Logger) => {
	const nestAdminServerExpress = express();
	nestAdminServerExpress.disable('x-powered-by');
	const nestAdminServerExpressAdapter = new ExpressAdapter(nestAdminServerExpress);
	const nestAdminServerApp = await NestFactory.create(AdminApiServerModule, nestAdminServerExpressAdapter);

	nestAdminServerApp.setGlobalPrefix('/admin/api/v1');
	await nestAdminServerApp.init();

	const adminApiServerPort = Configuration.get('ADMIN_API__PORT') as number;

	nestAdminServerExpress.listen(adminApiServerPort, () => {
		logger.info(
			new AppStartLoggable({
				appName: 'Admin Api server app',
				port: adminApiServerPort,
				mountsDescription: `/admin/api/v1 --> Admin Api Server`,
			})
		);
	});
};
