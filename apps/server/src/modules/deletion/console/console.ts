import { BootstrapConsole } from 'nestjs-console';
import { DeletionConsoleModule } from './deletion-console.module';

const bootstrap = new BootstrapConsole({
	module: DeletionConsoleModule,
	useDecorators: true,
});

void bootstrap.init().then(async (app) => {
	// eslint-disable-next-line promise/always-return
	try {
		await app.init();
		await bootstrap.boot();
		await app.close();
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(e);
		await app.close();
		process.exitCode = 1;
	}
});
