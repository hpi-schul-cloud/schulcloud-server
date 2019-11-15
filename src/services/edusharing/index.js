const { someService } = require('./services');

module.exports = (app) => {
	app.configure(someService);
};
