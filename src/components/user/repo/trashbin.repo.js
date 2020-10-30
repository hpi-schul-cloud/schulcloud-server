const { model: trashbinModel } = require('./db/trashbin.schema');

const createUserTrashbin2 = (userId) => {
	// access trashbin model
	const trashbin = trashbinModel({
		userId,
	});
	return trashbin.save();
};

const createUserTrashbin = async (user, app) => {
	const modelService = app.service('trashbinModel');
	const data = {
		userId: user._id,
		documentId: user._id,
		document: JSON.stringify(user),
		deletedAt: new Date(),
	};
	return modelService.create(data);
};

const updateUserTrashbin = (userId, data = {}) => {
	// access trashbin model
	return trashbinModel.updateOne({ userId }, data, { upsert: true });
};

module.exports = {
	createUserTrashbin,
	createUserTrashbin2,
	updateUserTrashbin,
};
