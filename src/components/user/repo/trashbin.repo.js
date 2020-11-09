const trashbinModel = require('./db/trashbin.schema');

const createUserTrashbinDR = (userId) => {
	// access trashbin model
	const trashbin = trashbinModel({
		userId,
	});
	return trashbin.save();
};

const createUserTrashbinMW = async (user, app) => {
	const modelService = app.service('trashbinModel');
	const data = {
		userId: user._id,
		documentId: user._id,
		document: JSON.stringify(user),
		deletedAt: new Date(),
	};
	return modelService.create(data);
};

const updateUserTrashbin = async (id, data = {}) => {
	// access trashbin model
	const trashbin = await trashbinModel.findById(id).exec();
	trashbin.set(data);
	return trashbin.save();
};

module.exports = {
	createUserTrashbinMW,
	createUserTrashbinDR,
	updateUserTrashbin,
};
