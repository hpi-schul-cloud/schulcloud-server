const { Configuration } = require('@schul-cloud/commons');
const { authenticate } = require('@feathersjs/authentication');
const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');
const { hasRole } = require('../../hooks');

const superheroAccess = async (context) => {
	const isSuperHero = await hasRole(context, context.params.account.userId, 'superhero');
	if (!isSuperHero) {
		return Promise.reject(new Forbidden('You has no access.'));
	}
	return context;
};

const configServiceHooks = {
	before: {
		all: [authenticate('jwt'), authenticate('api-key'), superheroAccess],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
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

/**
 * This service resolve configuration access for extern services for example shd.
 */
class ConfigService {
	setup(app) {
		this.app = app;
	}

	find() {
		return Configuration.printHierarchy();
	}
}

module.exports = {
	configServiceHooks,
	ConfigService,
};
