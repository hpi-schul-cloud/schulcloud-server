const reqlib = require('app-root-path').require;

const { Forbidden, GeneralError, NotFound, BadRequest, TypeError } = reqlib('src/errors');
const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

class UserServiceV2 {
	async remove(id, params) {
		const { query } = params;
		return this.userFacade.deleteUser(query.userId);
	}

	async setup(app) {
		this.app = app;
		this.userFacade = app.service('userFacade');
	}
}

const userServiceV2 = new UserServiceV2({
	// default pagination and other options
});

const hasPermission = async (context) => {
	const isSuperHero = await globalHooks.hasRole(context, context.params.account.userId, 'superhero');
	if (isSuperHero) {
		return context;
	}

	const isAdmin = await globalHooks.hasRole(context, context.params.account.userId, 'administrator');
	if (isAdmin) {
		return context;
	}

	throw new Forbidden('You has no access.');
};

const restrictToSameSchool = async (context) => {
	const isSuperHero = await globalHooks.hasRole(context, context.params.account.userId, 'superhero');
	if (isSuperHero) {
		return context;
	}

	let targetId;
	if (context.id) {
		targetId = context.id;
	} else {
		targetId = (((context || {}).params || {}).query || {}).userId;
	}

	if (targetId) {
		const { schoolId: currentUserSchoolId } = await globalHooks.getUser(context);
		const { schoolId: requestedUserSchoolId } = await context.app.service('users').get(targetId);

		if (!equalIds(currentUserSchoolId, requestedUserSchoolId)) {
			throw new Forbidden('You has no access.');
		}

		return context;
	}

	throw new BadRequest('The request query should include a valid userId');
};

const userServiceV2Hooks = {
	before: {
		all: [authenticate('jwt'), hasPermission, restrictToSameSchool],
	},
	after: {},
};

module.exports = { userServiceV2, userServiceV2Hooks };
