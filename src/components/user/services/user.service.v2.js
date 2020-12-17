const { authenticate } = require('@feathersjs/authentication');
const userUC = require('../uc/users.uc');
const { AssertionError } = require('../../../errors');
const { missingParameters } = require('../../../errors/helper/assertionErrorHelper');

class UserServiceV2 {
	constructor(roleNameSubject) {
		this.roleNameSubject = roleNameSubject;
	}

	async remove(id, params) {
		throw new AssertionError(missingParameters({ id }));
		await userUC.checkPermissions(id, this.roleNameSubject, 'DELETE', { ...params });
		return userUC.deleteUser(id);
	}

	async setup(app) {
		this.app = app;
	}
}

const adminHookGenerator = () => ({
	before: {
		all: [authenticate('jwt')],
	},
	after: {},
});

module.exports = { UserServiceV2, adminHookGenerator };
