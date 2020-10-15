const { Configuration } = require('@schul-cloud/commons');
const { disallow } = require('feathers-hooks-common');
const reqlib = require('app-root-path').require;

const { GeneralError } = reqlib('src/errors');

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
		const [user, school] = await Promise.all([
			this.app.service('users').get(id),
			this.app.service('schools').get(params.route.schoolId),
		]);

		const roles = await this.app.service('roles').find({ query: { _id: { $in: user.roles } } });
		const userPermissions = roles.data.map((role) => role.permissions).flat();

		const messengerPermissions = {};
		if (!user.schoolId.equals(school._id)) {
			messengerPermissions.messengerOneToOne = false;
		} else if (school.features.includes('messengerOneToOne') || userPermissions.includes('MESSENGER_ONE_TO_ONE')) {
			messengerPermissions.messengerOneToOne = true;
		}
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

module.exports = { messengerPermissionService: messengerPermissionService, messengerPermissionHooks: messengerPermissionHooks };