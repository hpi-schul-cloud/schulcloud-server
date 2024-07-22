/* istanbul ignore file */
import { IdpConsoleModule } from '@modules/idp-console';
import { BootstrapConsole } from 'nestjs-console';

async function run() {
	const bootstrap = new BootstrapConsole({
		module: IdpConsoleModule,
		useDecorators: true,
	});

	const app = await bootstrap.init();

	try {
		await app.init();

		// Execute console application with provided arguments.
		await bootstrap.boot();
	} catch (err) {
		// eslint-disable-next-line no-console, @typescript-eslint/no-unsafe-call
		console.error(err);

		// Set the exit code to 1 to indicate a console app failure.
		process.exitCode = 1;
	}

	// Always close the app, even if some exception
	// has been thrown from the console app.
	await app.close();
}

void run();
