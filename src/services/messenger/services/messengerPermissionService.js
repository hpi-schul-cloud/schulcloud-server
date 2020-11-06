const { disallow } = require('feathers-hooks-common');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { SCHOOL_FEATURES } = require('../../school/model');

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
		const [user, school] = await Promise.all([
			this.app.service('users').get(id),
			this.app.service('schools').get(params.route.schoolId),
		]);

		const roles = await this.app.service('roles').find({ query: { _id: { $in: user.roles } } });
		const userPermissions = roles.data.map((role) => role.permissions).flat();

		const messengerPermissions = {};
		messengerPermissions.createRoom =
			user.schoolId.equals(school._id) &&
			(userPermissions.includes('MESSENGER_ROOM_CREATE') ||
				(Configuration.get('MATRIX_MESSENGER__STUDENT_ROOM_CREATION') &&
					school.features.includes(SCHOOL_FEATURES.MESSENGER_STUDENT_ROOM_CREATE)));
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
