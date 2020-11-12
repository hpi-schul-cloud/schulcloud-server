const trashbinModel = require('./db/trashbin.schema');

module.exports = class TrashbinRepo {
	setup() {}

	/**
	 * Creates the trashbin document
	 * @param {string} userId UserId of user to be deleted
	 * @param {Object} data User data to be stored within trashbin
	 * @return {trashbinModel} Trashbin document
	 */
	async createUserTrashbin(userId, data) {
		const trashbinData = {
			...data,
			userId,
		};
		const trashbin = await trashbinModel.create(trashbinData);
		return trashbin.toObject();
	}

	/**
	 * Adds data to user trashbin document
	 * @param {string} id Id of user trashbin document
	 * @param {Object} data Data to be added/updated
	 */
	async updateUserTrashbin(id, data = {}) {
		// access trashbin model
		const trashbin = await trashbinModel.findByIdAndUpdate(id, { $set: data });
		return trashbin.toObject();
	}
};
