const { disallow } = require('feathers-hooks-common');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { SCHOOL_FEATURES } = require('../../school/model');
const { ForbiddenError } = require('../../../errors/applicationErrors');

class MessengerPermissionService {
	constructor(options) {
		this.options = options || {};
	}

	async setup(app) {
		this.app = app;
	}

	/**
	 * returns messenger permission for the given user
	 * @param {ObjectId} id ID of a user
	 * @param {Object} params feathers params object
	 */
	async get(id, params) {
		if (Configuration.get('FEATURE_MATRIX_MESSENGER_ENABLED') !== true) {
			throw new ForbiddenError('FEATURE_MATRIX_MESSENGER_ENABLED is disabled');
		}
		const user = await this.app.service('users').get(id);
		const school = await this.app.service('schools').get(user.schoolId);

		const roles = await this.app.service('roles').find({ query: { _id: { $in: user.roles } } });
		const userPermissions = roles.data.map((role) => role.permissions).flat();

		const messengerPermissions = {};
		messengerPermissions.createRoom =
			userPermissions.includes('MESSENGER_ROOM_CREATE') ||
			(Configuration.get('MATRIX_MESSENGER__STUDENT_ROOM_CREATION') &&
				school.features.includes(SCHOOL_FEATURES.MESSENGER_STUDENT_ROOM_CREATE));
		return messengerPermissions;
	}
}

const messengerPermissionService = new MessengerPermissionService({});

const messengerPermissionHooks = {
	before: {
		all: [],
		find: [disallow()],
		get: [],
		create: [disallow()],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
	after: {},
};

module.exports = {
	messengerPermissionService,
	messengerPermissionHooks,
};
