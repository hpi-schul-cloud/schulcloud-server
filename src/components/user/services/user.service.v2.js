const { authenticate } = require('@feathersjs/authentication');
const userUC = require('../uc/users.uc');

class UserServiceV2 {
	constructor(roleNameSubject) {
		this.roleNameSubject = roleNameSubject;
	}

	async remove(id, params) {
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
