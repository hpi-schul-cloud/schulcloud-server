const { Configuration } = require('@hpi-schul-cloud/commons');
const appPromise = require('./app');
const logger = require('./logger');
const express = require('@feathersjs/express');

Configuration.printHierarchy();

appPromise
	.then((api) => {
		const port = api.get('port');
        const app = express().use('/api', api);
        app.use('/', api);
		const server = app.listen(port);
        api.setup(server);

		server.on('listening', () => {
			logger.log('info', `Schul-Cloud application started on http://${app.get('host')}:${port}`);
		});
	})
	.catch((err) => {
		logger.error('server startup failed', err);
	});
