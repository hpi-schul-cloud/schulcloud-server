'use strict';

const Service = require('feathers-mongoose').Service;
const account = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;
	const userService = app.service('/users');

	class AccountService extends Service {
		create(data, params, done) {
			let account = null;
			return super.create(data, params)
				.then(newAccount => {
					account = newAccount;
					return userService.get(newAccount.userId);
				})
				.then(user => {
					user.accounts.push(account._id);
					return userService.update(user._id, user);
			})
				.then(user => {
					return account;
				});
		}
	}

	const options = {
		Model: account,
		paginate: {
			default: 5,
			max: 25
		}
	};

	// Initialize our service with any options it requires
	app.use('/accounts', new AccountService(options));

	// Get our initialize service to that we can bind hooks
	const accountService = app.service('/accounts');

	// Set up our before hooks
	accountService.before(hooks.before);

	// Set up our after hooks
	accountService.after(hooks.after);
};
