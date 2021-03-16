import { Configuration } from '@hpi-schul-cloud/commons';
import appPromise from './app';
import logger from './logger';

Configuration.printHierarchy();

appPromise
	.then((app) => {
		const port = app.get('port');
		const server = app.listen(port);

		server.on('listening', () => {
			logger.log('info', `Schul-Cloud application started on http://${app.get('host')}:${port}`);
		});
	})
	.catch((err) => {
		logger.error('server startup failed', err);
	});
