const copyService = require('./copy-service');
const modelService = require('./model-service');

module.exports = (app) => {
	app.configure(copyService);
	app.configure(modelService);
};
