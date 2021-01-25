const userComponent = require('./user');
const fileStorageComponent = require('./fileStorage');
const schoolComponent = require('./school');

module.exports = (app) => {
	app.configure(userComponent);
	app.configure(fileStorageComponent);
	app.configure(schoolComponent);
};
