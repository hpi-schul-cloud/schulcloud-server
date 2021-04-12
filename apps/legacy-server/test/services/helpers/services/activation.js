let entryIds = [];
const util = require('../../../../src/services/activation/utils/generalUtils');
const { activationModel } = require('../../../../src/services/activation/model');

const createTestEntry = (appPromise) => async (user, keyword, payload) => {
	const app = await appPromise;
	if (!user) throw new SyntaxError('User object missing');
	if (!keyword) throw new SyntaxError('keyword string missing');
	if (!payload) throw new SyntaxError('payload object missing');

	return util.createEntry(app, user._id, keyword, payload).then((entry) => {
		entryIds.push(entry._id.toString());
		return entry;
	});
};

const cleanup = (appPromise) => () => {
	if (entryIds.length === 0) {
		return Promise.resolve();
	}
	const ids = entryIds;
	entryIds = [];
	return activationModel
		.deleteMany({ _id: { $in: ids } })
		.lean()
		.exec();
};

module.exports = (app, opt) => ({
	create: createTestEntry(app, opt),
	cleanup: cleanup(app),
	info: entryIds,
});
