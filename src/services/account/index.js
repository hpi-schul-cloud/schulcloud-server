const service = require('feathers-mongoose');

const accountModel = require('./model');
const hooks = require('./hooks');
const hooksCJWT = require('./hooksCJWT');
const PasswordGenService = require('./PasswordGenService');
const CustomJWTService = require('./CustomJWTService');

module.exports = function setup() {
	const app = this;

	const options = {
		Model: accountModel,
		paginate: false,
		lean: true,
	};

	// Initialize our service with any options it requires

	app.use('/accounts/pwgen', new PasswordGenService());
	app.use('/accounts', service(options));
	app.use('/accounts/jwt', new CustomJWTService(app.get('secrets').authentication));
	app.use('/accounts/confirm', {
		create(data) {
			return accountModel.update({ _id: data.accountId }, { $set: { activated: true } });
		},
	});

	// Get our initialize service to that we can bind hooks
	const customJWTService = app.service('/accounts/jwt');
	const accountService = app.service('/accounts');

	// Set up our before hooks
	customJWTService.before(hooksCJWT.before);
	accountService.before(hooks.before);

	// Set up our after hooks
	customJWTService.after(hooksCJWT.after);
	accountService.after(hooks.after);
};
