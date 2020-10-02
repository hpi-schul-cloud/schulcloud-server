const { Configuration } = require('@schul-cloud/commons');
const app = require('./app');
const logger = require('./logger');

Configuration.printHierarchy();

const port = app.get('port');
const server = app.listen(port);

server.on('listening', () => {
	logger.log('info', `Schul-Cloud application started on http://${app.get('host')}:${port}`);
});
