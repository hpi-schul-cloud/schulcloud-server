/* istanbul ignore file */
import { DomainErrorHandler } from '@core/error';
import { MediaSyncConsoleAppModule } from '@modules/media-sync-console/media-sync-console.app.module';
import { BootstrapConsole } from 'nestjs-console';

async function run(): Promise<void> {
	const bootstrap = new BootstrapConsole({
		module: MediaSyncConsoleAppModule,
		useDecorators: true,
	});

	const app = await bootstrap.init();

	try {
		await app.init();

		// Execute console application with provided arguments.
		await bootstrap.boot();
	} catch (err) {
		const domainErrorHandler = app.get(DomainErrorHandler);
		domainErrorHandler.exec(err);

		// Set the exit code to 1 to indicate a console app failure.
		process.exitCode = 1;
	}

	// Always close the app, even if some exception
	// has been thrown from the console app.
	await app.close();
}

void run();
