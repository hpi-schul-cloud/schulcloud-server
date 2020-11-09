const trashbinModel = require('./db/trashbin.schema');

/**
 * Creates the trashbin document
 * @param app
 * @param {string} userId UserId of user to be deleted
 * @param data
 * @returns {trashbinModel} Trashbin document
 */
const createUserTrashbin = async (app, userId, data) => {
	const modelService = app.service('trashbinModel');

	const trashbinData = {
		userId,
		...data,
	};
	return modelService.create(trashbinData);
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
	createUserTrashbin,
	updateUserTrashbin,
};
