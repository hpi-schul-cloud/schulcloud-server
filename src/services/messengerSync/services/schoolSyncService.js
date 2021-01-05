const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider, disallow } = require('feathers-hooks-common');

const { BadRequest } = require('../../../errors');
const { hasPermission, restrictToCurrentSchool } = require('../../../hooks');
const { requestFullSchoolSync } = require('../producer');
const { SCHOOL_FEATURES } = require('../../school/model');

class MessengerSchoolSync {
	constructor(options) {
		this.options = options || {};
	}

	async setup(app) {
		this.app = app;
	}

	/**
	 * syncs the rooms of all users on the school.
	 * @param {Object} data should contain a schoolId field
	 * @param {Object} params feathers params object.
	 */
	async create(data, params) {
		const school = await this.app.service('schools').get(params.route.schoolId);
		if (!school.features.includes(SCHOOL_FEATURES.MESSENGER)) {
			throw new BadRequest('This school does not support the messenger feature.');
		}

		requestFullSchoolSync(school);
		return school;
	}
}

const messengerSchoolSyncService = new MessengerSchoolSync({
	paginate: {
		default: 50,
		max: 500,
	},
});

const messengerSchoolSyncHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [disallow()],
		get: [disallow()],
		create: [iff(isProvider('external'), [hasPermission('MESSENGER_SYNC'), restrictToCurrentSchool])],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
	},
};

module.exports = { messengerSchoolSyncService, messengerSchoolSyncHooks };
