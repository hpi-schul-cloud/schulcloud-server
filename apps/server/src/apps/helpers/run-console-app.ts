/* istanbul ignore file */
import { DomainErrorHandler } from '@core/error';
import { BootstrapConsole } from 'nestjs-console';

export const runConsoleApp = async <T>(module: T): Promise<void> => {
	const bootstrap = new BootstrapConsole({
		module,
		useDecorators: true,
	});

	const app = await bootstrap.init();

	// We need the DomainErrorHandler to be able to use Loggables
	// and e.g. prevent secrets from being logged.
	// Get the provider here instead of in the catch block
	// in order to fail early if it is missing.
	const domainErrorHandler = app.get(DomainErrorHandler);

	try {
		await app.init();

		// Execute console application with provided arguments.
		await bootstrap.boot();
	} catch (err) {
		domainErrorHandler.exec(err);

		// Set the exit code to 1 to indicate a console app failure.
		process.exitCode = 1;
	}

	// Always close the app, even if some exception
	// has been thrown from the console app.
	await app.close();
};
