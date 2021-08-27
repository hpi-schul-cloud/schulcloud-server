const trashbinModel = require('../../../../src/components/user/repo/db/trashbin.schema');

let createdTrashbinObjects = [];

const create = (opt) => async (data) => {
	data = data || {};
	data.userId = data.userId || opt.generateObjectId();
	data.data = data.data || [];

	const trashbinObject = await trashbinModel.create(data);
	createdTrashbinObjects.push(trashbinObject._id);
	return trashbinObject;
};

const cleanup = () => {
	if (createdTrashbinObjects.length === 0) {
		return Promise.resolve();
	}
	const ids = createdTrashbinObjects;
	createdTrashbinObjects = [];
	return trashbinModel
		.deleteMany({ id: { $in: ids } })
		.lean()
		.exec();
};

module.exports = (app, opt) => ({
	create: create(opt),
	cleanup,
	info: () => createdTrashbinObjects,
});
