const copyService = require('./copy-service');
const modelService = require('./model-service');
const shareService = require('./services/homeworkShare.service');

module.exports = (app) => {
	app.configure(copyService);
	app.configure(modelService);
	app.configure(shareService);
};
