const logger = require('../logger');

const addLogger = (app) => {
	app.logger = logger;
};

module.exports = addLogger;
