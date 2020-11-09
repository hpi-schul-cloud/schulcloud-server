const { authenticate } = require('@feathersjs/authentication');
const { deleteUserUC } = require('../uc/users.uc');

class UserServiceV2 {
	async remove(id, params) {
		return deleteUserUC(id, this.app);
	}

	async setup(app) {
		this.app = app;
	}
}

const userServiceV2 = new UserServiceV2({
	// default pagination and other options
});

const userServiceV2Hooks = {
	before: {
		all: [
			authenticate('jwt'),
			// check permissions
			// restrict to current school
			// etc
		],
	},
	after: {},
};

module.exports = { userServiceV2, userServiceV2Hooks };
