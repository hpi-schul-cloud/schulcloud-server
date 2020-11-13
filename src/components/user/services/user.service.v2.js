const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const userUC = require('../uc/users.uc');

class UserServiceV2 {
	constructor(roleName) {
		this.roleName = roleName;
	}

	async remove(id, params) {
		return userUC.deleteUserUC(id, { ...params, app: this.app });
	}

	async setup(app) {
		this.app = app;
	}
}

const adminHookGenerator = (kind) => ({
	before: {
		all: [authenticate('jwt')],
		remove: [globalHooks.hasSchoolPermission(`${kind}_DELETE`)],
	},
	after: {},
});

module.exports = { UserServiceV2, adminHookGenerator };
