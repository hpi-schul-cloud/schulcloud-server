const trashbinModel = require('./db/trashbin.schema');

/**
 * Creates the trashbin document
 * @param {string} userId UserId of user to be deleted
 * @param {Object} data User data to be stored within trashbin
 * @return {trashbinModel} Trashbin document
 */
const createUserTrashbin = async (userId, data) => {
	const trashbinData = {
		data,
		userId,
	};
	const trashbin = await trashbinModel.create(trashbinData);
	return trashbin.toObject();
};

/**
 * Adds data to user trashbin document
 * @param {string} id Id of user trashbin document
 * @param {Object} data Data to be added/updated
 */
const updateTrashbinByUserId = async (userId, data = {}) => {
	// access trashbin model
	const trashbin = await trashbinModel
		.findOneAndUpdate({ userId }, { $push: { data } }, { new: true })
		.sort({
			createdAt: -1,
		})
		.lean()
		.exec();
	return trashbin;
};

module.exports = {
	createUserTrashbin,
	updateTrashbinByUserId,
};
