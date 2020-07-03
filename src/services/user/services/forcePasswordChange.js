const { BadRequest } = require('@feathersjs/errors');
const { disallow } = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const { passwordsMatch } = require('../../../utils/passwordHelpers');

const ForcePasswordChangeServiceHooks = {
	before: {
		all: [],
		find: disallow('external'),
		get: disallow('external'),
		create: [authenticate('jwt')],
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
	constructor(options) {
		this.options = options || {};
		this.err = Object.freeze({
			missmatch: 'Die neuen Passwörter stimmen nicht überein.',
			failed: 'Can not update the password. Please contact the administrator',
		});
	}

	async newPasswordProvidedByUser(data, params) {
		const newPassword = data['password-1'];
		if (!passwordsMatch(newPassword, data['password-2'])) {
			throw new BadRequest(this.err.missmatch);
		}

		const accountUpdate = {
			password: newPassword,
			userForcedToChangePassword: true,
		};

		const accountPromise = this.app.service('/accounts')
			.patch(params.account._id, accountUpdate, params);

		const userPromise = this.app.service('/users')
			.patch(params.account.userId, { forcePasswordChange: false });

		return Promise.allSettled([accountPromise, userPromise])
			.then(([accountResponse, userResponse]) => {
				if (accountResponse.status === 'rejected') {
					throw new Error(accountResponse.reason);
				}
				if (userResponse.status === 'rejected') {
					throw new Error(userResponse.reason);
				}
				return Promise.resolve(userResponse.value);
			})
			.catch((err) => {
				throw new BadRequest(this.err.failed, err);
			});
	}

	create(data, params) {
		return this.newPasswordProvidedByUser(data, params);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;
	app.use('/forcePasswordChange', new ForcePasswordChangeService());
	const forcePasswordChangeService = app.service('forcePasswordChange');
	forcePasswordChangeService.hooks(ForcePasswordChangeServiceHooks);
};
