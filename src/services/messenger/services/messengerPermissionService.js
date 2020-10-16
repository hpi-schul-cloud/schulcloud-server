const { disallow } = require('feathers-hooks-common');

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
			(school.features.includes('studentsMessengerRoomCreate') || userPermissions.includes('MESSENGER_ROOM_CREATE'));
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
