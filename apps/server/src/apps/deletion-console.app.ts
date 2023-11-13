/* istanbul ignore file */
import { BootstrapConsole } from 'nestjs-console';
import { DeletionConsoleModule } from '@modules/deletion';

const bootstrap = new BootstrapConsole({
	module: DeletionConsoleModule,
	useDecorators: true,
});

const logErrorAndSetExitCode = (err: unknown) => {
	// eslint-disable-next-line no-console
	console.error(err);
	process.exitCode = 1;
};

bootstrap
	.init()
	.then(async (app) => {
		// eslint-disable-next-line promise/always-return
		try {
			await app.init();
			await bootstrap.boot();
			await app.close();
		} catch (err) {
			await app.close();

			logErrorAndSetExitCode(err);
		}
	})
	.catch((err) => logErrorAndSetExitCode(err));
