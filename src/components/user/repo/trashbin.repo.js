const trashbinModel = require('./db/trashbin.schema');

/**
 * Creates the trashbin document
 * @param {string} userId UserId of user to be deleted
 * @returns {trashbinModel} Trashbin document
 */
const createUserTrashbinDR = async (userId) => {
	const trashbin = await trashbinModel.create({ userId });
	return trashbin.toObject();
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

/**
 * Adds data to user trashbin document
 * @param {string} id Id of user trashbin document
 * @param {Object} data Data to be added/updated
 */
const updateUserTrashbin = async (id, data = {}) => {
	// access trashbin model
	const trashbin = await trashbinModel.findByIdAndUpdate(id, { $set: data });
	return trashbin.toObject();
};

module.exports = {
	createUserTrashbinMW,
	createUserTrashbinDR,
	updateUserTrashbin,
};
