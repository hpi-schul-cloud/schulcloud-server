/* eslint-disable promise/always-return */
// console.ts - example of entrypoint
import { BootstrapConsole } from 'nestjs-console';
import { ServerModule } from './server.module';
// import { FilesModule } from './modules/files/files.module';

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
