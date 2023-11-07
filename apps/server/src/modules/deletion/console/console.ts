import { BootstrapConsole } from 'nestjs-console';
import { DeletionConsoleModule } from './deletion-console.module';

const bootstrap = new BootstrapConsole({
	module: DeletionConsoleModule,
	useDecorators: true,
});

void bootstrap.init().then(async (app) => {
	try {
		await app.init();

		await bootstrap.boot();

		await app.close();
	} catch (e) {
		console.error(e);

		await app.close();

		process.exitCode = 1;
	}
});
