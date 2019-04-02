const m = require('../model');

const deleteUser = (app) => {
	app.service('users').on('deleted', (result, context) => {

	});
};

module.exports = (app) => {
	deleteUser(app);
};
