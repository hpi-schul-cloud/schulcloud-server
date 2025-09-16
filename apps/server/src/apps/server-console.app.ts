/* istanbul ignore file */
/* eslint-disable promise/always-return */
import { ManagementConsoleModule } from '@modules/management/management-console.app.module';
import { BootstrapConsole } from 'nestjs-console';
import { DomainErrorHandler } from '@core/error';

/**
 * The console is starting the application wrapped into commander.
 * This allows adding console commands to execute provider methods.
 */
const bootstrap = new BootstrapConsole({
	module: ManagementConsoleModule,
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
		const domainErrorHandler = app.get(DomainErrorHandler);
		domainErrorHandler.exec(e);

		await app.close();
		process.exit(1);
	}
});
