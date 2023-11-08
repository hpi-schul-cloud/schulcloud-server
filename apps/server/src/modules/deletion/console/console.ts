import { BootstrapConsole } from 'nestjs-console';
import { DeletionConsoleModule } from './deletion-console.module';

const bootstrap = new BootstrapConsole({
	module: DeletionConsoleModule,
	useDecorators: true,
});

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

			// eslint-disable-next-line no-console
			console.error(err);
			process.exitCode = 1;
		}
	})
	.catch((err) => {
		// eslint-disable-next-line no-console
		console.error(err);
		process.exitCode = 1;
	});
