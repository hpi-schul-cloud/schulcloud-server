/* eslint-disable promise/always-return */
// console.ts - example of entrypoint
import { BootstrapConsole } from 'nestjs-console';
import { ServerConsoleModule } from './server-console.module';

const bootstrap = new BootstrapConsole({
	module: ServerConsoleModule,
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
		process.exit(1);
	}
});
