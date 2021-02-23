const { authenticate } = require('@feathersjs/authentication');
const { ValidationError } = require('../../../errors');
const { API_VALIDATION_ERROR_TYPE } = require('../../../errors/commonErrorTypes');
const { arrayShouldNotBeEmpty, arrayShouldNotExceedLength } = require('../../../errors/validationErrorHelper');
const { populateUser } = require('../populateUserHook');
const userUC = require('../uc/users.uc');

const MAX_DELETE_USER_COUNT = 100;

// TODO remove when we can rely on OpenAPI validation
const validateIds = (ids) => {
	if (ids.length === 0) {
		const error = new ValidationError(API_VALIDATION_ERROR_TYPE, arrayShouldNotBeEmpty({ ids }));
		throw error;
	}

	if (ids.length > MAX_DELETE_USER_COUNT) {
		const error = new ValidationError(API_VALIDATION_ERROR_TYPE, arrayShouldNotExceedLength({ ids }));
		throw error;
	}
}

class UserServiceV2 {
	constructor(roleNameSubject) {
		this.roleNameSubject = roleNameSubject;
	}

	async remove(id, params) {
		const ids = [];
		if (id) {
			ids.push(id);
		} else if (params.query.ids) {
			ids.push(...params.query.ids);
		}

		// TODO remove when we can rely on OpenAPI validation
		validateIds(ids);

		await userUC.checkPermissions(ids, this.roleNameSubject, 'DELETE', { ...params });
		await Promise.all(ids.map((userId) => userUC.deleteUser(userId, { ...params })));
	}

	async setup(app) {
		this.app = app;
	}
}

const adminHookGenerator = () => ({
	before: {
		all: [authenticate('jwt'), populateUser],
	},
	after: {},
});

module.exports = { UserServiceV2, adminHookGenerator };
