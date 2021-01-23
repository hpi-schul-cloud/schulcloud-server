const userComponent = require('./user');
const fileStorageComponent = require('./fileStorage');
const helpdeskComponent = require('./helpdesk');
const pseudonymComponent = require('./pseudonym');
const courseComponent = require('./course');
const schoolComponent = require('./school');

module.exports = (app) => {
	app.configure(userComponent);
	app.configure(fileStorageComponent);
	app.configure(helpdeskComponent);
	app.configure(pseudonymComponent);
	app.configure(courseComponent);
	app.configure(schoolComponent);
};
