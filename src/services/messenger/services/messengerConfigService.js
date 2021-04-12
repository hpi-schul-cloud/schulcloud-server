const { disallow } = require('feathers-hooks-common');
const { hasPermission } = require('../../../hooks');

const schoolMessengerOptions = ['messenger', 'studentsCanCreateMessengerRoom', 'messengerSchoolRoom'];

class MessengerConfigService {
	constructor(options) {
		this.options = options || {};
	}

	async setup(app) {
		this.app = app;
	}

	async find(params) {
		const school = await this.app.service('schools').get(params.route.schoolId);
		return Object.fromEntries(schoolMessengerOptions.map((option) => [option, school.features.includes(option)]));
	}

	async patch(_id, data, params) {
		const school = await this.app.service('schools').get(params.route.schoolId);

		// remove data unrelated to messenger
		Object.keys(data)
			.filter((key) => !schoolMessengerOptions.includes(key))
			.forEach((key) => delete data[key]);

		let [pushValues, pullValues] = Object.keys(data).reduce(
			(result, element) => {
				result[data[element] ? 0 : 1].push(element);
				return result;
			},
			[[], []]
		);

		pushValues = pushValues.filter((value) => !school.features.includes(value));
		pullValues = pullValues.filter((value) => school.features.includes(value));

		await Promise.all([
			this.app.service('schools').patch(school._id, { $push: { features: { $each: pushValues } } }, params),
			this.app.service('schools').patch(school._id, { $pull: { features: { $in: pullValues } } }, params),
		]);

		return this.find(params);
	}
}

const messengerConfigService = new MessengerConfigService({});

const messengerConfigHooks = {
	before: {
		all: [],
		find: [],
		get: [disallow()],
		create: [disallow()],
		update: [disallow()],
		patch: [hasPermission('SCHOOL_EDIT', 'SCHOOL_CHAT_MANAGE')],
		remove: [disallow()],
	},
	after: {},
};

module.exports = { messengerConfigService, messengerConfigHooks };
