const userComponent = require('./user');

module.exports = (app) => {
	app.configure(userComponent);
};
