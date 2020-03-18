const Ajv = require('ajv');
const { Writable } = require('stream');
const {	Forbidden, GeneralError, BadRequest } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication');
const {
	iff, isProvider, validateSchema, disallow,
} = require('feathers-hooks-common');
const { Configuration } = require('@schul-cloud/commons');
const { createChannel } = require('../../../utils/rabbitmq');
const { hasPermission, restrictToCurrentSchool } = require('../../../hooks');
// const { datasourcesDocs } = require('../docs');

const internalQueue = 'matrix_sync_unpopulated';

class MessengerSchoolSync {
	constructor(options) {
		this.options = options || {};
	}

	async setup(app) {
		this.app = app;
		this.channel = await createChannel();
	}

	/**
	 * syncs the rooms of all users on the school.
	 * @param {Object} data should contain a schoolId field
	 * @param {Object} params feathers params object.
	 */
	async create(data, params) {
		if (!Configuration.get('FEATURE_RABBITMQ_ENABLED')) throw new GeneralError('feature not supported.');

		const school = await this.app.service('schools').get(params.route.schoolId);
		if (!school.features.includes('messenger')) throw new BadRequest('this school does not support the messenger');
		const users = await this.app.service('users').find({ query: { schoolId: school._id } });
		users.data.forEach((user) => {
			const message = JSON.stringify({ userId: user._id, schoolSync: true });
			this.channel.sendToQueue(internalQueue, Buffer.from(message), { persistent: true });
		});
		return users;
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
		all: [
			authenticate('jwt'),
		],
		find: [
			disallow(),
		],
		get: [
			disallow(),
		],
		create: [
			iff(isProvider('external'), [
				hasPermission('MESSENGER_SYNC'),
				restrictToCurrentSchool,
			]),
		],
		update: [
			disallow(),
		],
		patch: [
			disallow(),
		],
		remove: [
			disallow(),
		],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
	},
};

module.exports = { messengerSchoolSyncService, messengerSchoolSyncHooks };
