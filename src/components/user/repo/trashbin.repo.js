const { model: trashbinModel } = require('./db/trashbin.schema');

const createUserTrashbin = (userId) => {
	// access trashbin model
	const trashbin = trashbinModel({
		userId,
	});
	return trashbin.save();
};

const updateUserTrashbin = (userId, data = {}) => {
	// access trashbin model
	return trashbinModel.updateOne({ userId }, data, { upsert: true });
};

module.exports = {
	createUserTrashbin,
	updateUserTrashbin,
};
