const notFound = require('./not-found-handler');
const addLogger = require('./logger');

module.exports = (app) => {
	// eslint-disable-next-line no-console
	console.info('register middleware');
	app.configure(addLogger);
	app.use(notFound); // @deprecated?
};
