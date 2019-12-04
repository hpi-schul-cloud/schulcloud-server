const notFound = require('./not-found-handler');
const addLogger = require('./logger');

module.exports = (app) => {
	app.configure(addLogger);
	app.use(notFound); // @deprecated?
};
