/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';
import { install as sourceMapInstall } from 'source-map-support';
import { TldrawAppModule } from '@src/modules/tldraw';
import { AppStartLoggable } from '@src/apps/helpers/app-start-loggable';
import { Logger } from '@src/core/logger';

async function bootstrap() {
	sourceMapInstall();
	const nestApp = await NestFactory.create(TldrawAppModule);
	const logger = await nestApp.resolve(Logger);
	nestApp.enableCors();
	const port = 3344;
	await nestApp.listen(port);

	logger.log(
		new AppStartLoggable({
			appName: 'Tldraw server app',
			port,
		})
	);
}

void bootstrap();
