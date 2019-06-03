

const service = require('feathers-mongoose');
const errors = require('feathers-errors');
const passwordRecovery = require('./model');
const hooks = require('./hooks');
const AccountModel = require('./../account/model');

class ChangePasswordService {
	constructor() {
	}

	create(data) {
		return AccountModel.update({ _id: data.accountId }, { password: data.password })
			.then(account => passwordRecovery.update({ _id: data.resetId }, { changed: true })
				.then((_ => account))).catch(error => error);
	}
}

module.exports = function () {
	const app = this;

	const options = {
		Model: passwordRecovery,
		paginate: {
			default: 100,
			max: 100,
		},
		lean: true,
	};

	// Initialize our service with any options it requires
	app.use('/passwordRecovery', service(options));

	app.use('/passwordRecovery/reset', new ChangePasswordService());

	// Get our initialize service to that we can bind hooks
	const passwordRecoveryService = app.service('/passwordRecovery');

	const changePasswordService = app.service('/passwordRecovery/reset');

	// Set up our before hooks
	passwordRecoveryService.before(hooks.before);
	changePasswordService.before(hooks.before);

	// Set up our after hooks
	passwordRecoveryService.after(hooks.after);
	changePasswordService.after(hooks.after);
};
