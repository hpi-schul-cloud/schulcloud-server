/* istanbul ignore file */
import { BootstrapConsole } from 'nestjs-console';
import { TldrawConsoleModule } from '@modules/tldraw/tldraw-console.module';

async function run() {
	const bootstrap = new BootstrapConsole({
		module: TldrawConsoleModule,
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
		process.exit(1);
	}

	// Always close the app, even if some exception
	// has been thrown from the console app.
	await app.close();
}

void run();
