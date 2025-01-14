/* istanbul ignore file */
/* eslint-disable promise/always-return */
import { BootstrapConsole } from 'nestjs-console';
import { ServerConsoleModule } from '../modules/server-console/server-console.module';

/**
 * The console is starting the application wrapped into commander.
 * This allows adding console commands to execute provider methods.
 */
const bootstrap = new BootstrapConsole({
	module: ServerConsoleModule,
	useDecorators: true,
});
void bootstrap.init().then(async (app) => {
	try {
		await app.init();
		await bootstrap.boot();
		await app.close();
		process.exit(0);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(e);
		await app.close();
		process.exit(1);
	}
});
