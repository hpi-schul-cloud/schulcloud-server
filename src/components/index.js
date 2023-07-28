const userComponent = require('./user');
const fileStorageComponent = require('./fileStorage');
const pseudonymComponent = require('./pseudonym');
const courseComponent = require('./course');
const userGroupComponent = require('./user-group');
const schoolComponent = require('./school');
const teamsComponent = require('./teams');

module.exports = (app) => {
	app.configure(userComponent);
	app.configure(fileStorageComponent);
	app.configure(pseudonymComponent);
	app.configure(courseComponent);
	app.configure(schoolComponent);
	app.configure(userGroupComponent);
	app.configure(teamsComponent);
};
