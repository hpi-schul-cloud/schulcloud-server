/* istanbul ignore file */
/* eslint-disable no-console */
import { NestFactory } from '@nestjs/core';

// register source-map-support for debugging
import { install as sourceMapInstall } from 'source-map-support';

// application imports
import { LegacyLogger } from '@src/core/logger';
import { H5PLibraryManagementModule } from '@src/modules/h5p-library-management/h5p-library-management.module';
import { H5PLibraryManagementService } from '@src/modules/h5p-library-management/service/h5p-library-management.service';

async function bootstrap() {
	sourceMapInstall();

	const app = await NestFactory.createApplicationContext(H5PLibraryManagementModule);

	// WinstonLogger
	app.useLogger(await app.resolve(LegacyLogger));

	await app.get(H5PLibraryManagementService).run();
	// TODO: properly close app (there is some issue with the logger)
	// await app.close();
	process.exit(0);
}
void bootstrap();
