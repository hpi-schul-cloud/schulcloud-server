const System = require('../../../../src/services/system/model');

let createdSystemIds = [];

const createTestSystem =
	(appPromise) =>
	async (options = { url: '', type: 'moodle' }) => {
		const app = await appPromise;
		const system = await app.service('systems').create(options);
		createdSystemIds.push(system._id.toString());
		return system;
	};

const cleanup = async () => {
	if (createdSystemIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdSystemIds;
	createdSystemIds = [];
	return System.deleteMany({ _id: { $in: ids } });
};

module.exports = (app) => ({
	create: createTestSystem(app),
	cleanup,
	info: createdSystemIds,
});
