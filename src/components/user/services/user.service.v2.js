const { authenticate } = require('@feathersjs/authentication');
const { BadRequest } = require('../../../errors');
const { replaceUserWithTombstone, putUserToTrashbin } = require('../uc/users.uc');
const logger = require('../../../logger');

class UserServiceV2 {
	async remove(id, params) {
		const res = await putUserToTrashbin(id, this.app);
		if (res.success) {
			return replaceUserWithTombstone(id, this.app).catch((error) => {
				logger.error(error);
				return new BadRequest('User cannot be replaced with tombstone', error);
			});
		}
		else {
			return new BadRequest('User cannot be put to trashbin');
		}
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
