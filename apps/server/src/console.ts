/* istanbul ignore file */
// TODO add console e2e test definitions
/* eslint-disable promise/always-return */
import { BootstrapConsole } from 'nestjs-console';
import { ServerModule } from './server.module';

const bootstrap = new BootstrapConsole({
	module: ServerModule,
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
