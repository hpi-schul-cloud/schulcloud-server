const { disallow } = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');

const { BadRequest } = require('../../../errors');

const addUserForcedToChangePasswordFlag = (context) => {
	context.params.userForcedToChangePassword = true;
	return context;
};

const ForcePasswordChangeServiceHooks = {
	before: {
		all: [],
		find: disallow('external'),
		get: disallow('external'),
		create: [authenticate('jwt'), addUserForcedToChangePasswordFlag],
		update: disallow('external'),
		patch: disallow('external'),
		remove: disallow('external'),
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

class ForcePasswordChangeService {
	async newPasswordProvidedByUser(data, params) {
		const currentUserId = params.account.userId;
		const newPassword = data['password-1'];
		const newPasswordConfirm = data['password-2'];

		try {
			await this.app
				.service('nest-account-uc')
				.replaceMyTemporaryPassword(currentUserId, newPassword, newPasswordConfirm);
		} catch (err) {
			throw new BadRequest(err);
		}
	}

	create(data, params) {
		return this.newPasswordProvidedByUser(data, params);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	ForcePasswordChangeService,
	ForcePasswordChangeServiceHooks,
};
