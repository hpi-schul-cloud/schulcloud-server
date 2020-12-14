const userComponent = require('./user');
const fileStorageComponent = require('./fileStorage');

module.exports = (app) => {
	app.configure(userComponent);
	app.configure(fileStorageComponent);
};
