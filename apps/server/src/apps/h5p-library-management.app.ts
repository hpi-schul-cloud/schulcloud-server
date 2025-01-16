/* istanbul ignore file */
/* eslint-disable no-console */
import { H5PLibraryManagementService } from '@modules/h5p-library-management';
import { H5PLibraryManagementModule } from '@modules/h5p-library-management/h5p-library-management.app.module';
import { NestFactory } from '@nestjs/core';
import { LegacyLogger } from '@src/core/logger';
import { install as sourceMapInstall } from 'source-map-support';

async function bootstrap(): Promise<void> {
	sourceMapInstall();

	const nestApp = await NestFactory.createApplicationContext(H5PLibraryManagementModule);

	// WinstonLogger
	nestApp.useLogger(await nestApp.resolve(LegacyLogger));

	await nestApp.init();

	console.log('#########################################');
	console.log(`##### Start H5P Library Management ######`);
	console.log('#########################################');

	// to execute it on this place for the ORM the allowGlobalContext: true must be set, but to executed in this way is a hack
	await nestApp.get(H5PLibraryManagementService).run();
	// TODO: properly close app (there is some issue with the logger)
	console.log('#########################################');
	console.log(`##### Close H5P Library Management ######`);
	console.log('#########################################');
	await nestApp.close();
	process.exit(0);
}
void bootstrap();
