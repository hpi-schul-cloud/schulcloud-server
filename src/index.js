const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('./app');
const logger = require('./logger');

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
