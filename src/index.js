'use strict';

const app = require('./app');
const port = app.get('port');
const server = app.listen(port);
const logger = app.logger;

server.on('listening', () => {
	logger.log('info', `Schul-Cloud application started on http://${app.get('host')}:${port}`);
});
