const { disallow } = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const bcrypt = require('bcryptjs');

const { BadRequest } = require('../../../errors');
const { passwordsMatch } = require('../../../utils/passwordHelpers');

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
	constructor(options) {
		this.options = options || {};
		this.err = Object.freeze({
			missmatch: 'Die neuen Passwörter stimmen nicht überein.',
			failed: 'Can not update the password. Please contact the administrator',
			passwordSameAsPrevious: 'You need to setup your new unique password',
		});
	}

	async newPasswordProvidedByUser(data, params) {
		const newPassword = data['password-1'];
		if (!passwordsMatch(newPassword, data['password-2'])) {
			throw new BadRequest(this.err.missmatch);
		}

		const passwordSameAsPrevious = await bcrypt.compare(newPassword, params.account.password);
		if (passwordSameAsPrevious) {
			throw new BadRequest(this.err.passwordSameAsPrevious);
		}

		const accountUpdate = {
			password: newPassword,
		};

		const accountPromise = this.app.service('/accounts').patch(params.account._id, accountUpdate, params);
		await accountPromise
			.then((result) => Promise.resolve(result))
			.catch((err) => {
				throw new BadRequest(this.err.failed, err);
			});

		const userPromise = this.app.service('/users').patch(params.account.userId, { forcePasswordChange: false });
		return userPromise
			.then((result) => Promise.resolve(result))
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

module.exports = {
	ForcePasswordChangeService,
	ForcePasswordChangeServiceHooks,
};
