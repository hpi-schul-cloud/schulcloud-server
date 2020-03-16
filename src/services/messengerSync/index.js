const eventListener = require('./eventListener');

module.exports = (app) => {
	app.configure(eventListener);
};
