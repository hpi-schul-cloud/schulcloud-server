const eventListener = require('./eventListener');
const consumer = require('./consumer');

module.exports = (app) => {
	app.configure(eventListener);
	app.configure(consumer);
};
