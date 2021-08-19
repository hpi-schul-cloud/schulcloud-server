const { Configuration } = require('@hpi-schul-cloud/commons');
const express = require('@feathersjs/express');
const appPromise = require('./app');
const logger = require('./logger');

Configuration.printHierarchy();

const bootstrap = async () => {
	const api = await appPromise;
	const port = api.get('port');
	const app = express();
	app.use('/', api);
	const server = app.listen(port);
	api.setup(server);

	server.on('listening', () => {
		logger.log('info', `Schul-Cloud application started on http://${app.get('host')}:${port}`);
	});
};

try {
	bootstrap();
} catch (err) {
	logger.error('server startup failed', err);
}
