const { Configuration } = require('@schul-cloud/commons');
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
		if (!Configuration.get('FEATURE_MATRIX_MESSENGER_ENABLED')) {
			throw new GeneralError('messenger not supported on this instance');
		}
		const user = await this.app.service('users').get(id);
		const [roles, school] = await Promise.all([
			this.app.service('roles').find({ query: { _id: { $in: user.roles } } }),
			this.app.service('schools').get(user.schoolId),
		]);
		const roleNames = roles.data.map((role) => role.name) || [];

		const permissions = [];
		if (school.features.includes('messengerOneToOne')) {
			permissions.push('messengerOneToOne');
		}
		return permissions;
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

module.exports = { messengerPermissionService: messengerPermissionService, messengerPermissionHooks: messengerPermissionHooks };