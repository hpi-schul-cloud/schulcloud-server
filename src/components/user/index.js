const serviceLayer = require('./services');

module.exports = (app) => {
	app.configure(serviceLayer);
};
