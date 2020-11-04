const { model: trashbinModel } = require('./db/trashbin.schema');

const createUserTrashbin = (userId) => {
	// access trashbin model
	const trashbin = trashbinModel({
		userId,
	});
	return trashbin.save();
};

const updateUserTrashbin = async (id, data = {}) => {
	// access trashbin model
	const trashbin = await trashbinModel.findById(id).exec();
	trashbin.set(data);
	return trashbin.save();
};

module.exports = {
	createUserTrashbin,
	updateUserTrashbin,
};
