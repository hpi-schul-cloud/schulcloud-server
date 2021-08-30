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

const deleteExpiredData = async (backupPeriodThreshold) => {
	return trashbinModel.deleteMany({ createdAt: { $lt: backupPeriodThreshold }, skipDeletion: {$ne: true} });
};

const getTrashbinObjectsByUserId = async (userId) => {
	return trashbinModel.find({ userId: userId });
};

const getExpiredTrashbinDataByScope = async (scope, backupPeriodThreshold) => {
	const trashbinData = await trashbinModel.aggregate([
		// filter by data older then the defined backup period
		{
			$match: {
				createdAt: {
					$lt: backupPeriodThreshold,
				},
			},
		},
		// unwind the trashbin data of all users
		{
			$unwind: {
				path: '$data',
			},
		},
		// discard unneeded data
		{
			$project: {
				data: 1,
			},
		},
		// filter by trashbin data regarding file deletion
		{
			$match: {
				'data.scope': scope,
			},
		},
		// unwind files
		{
			$unwind: {
				path: '$data.data',
			},
		},
	]);
	return trashbinData.map((d) => {
		const data = d.data.data;
		data.trashbinId = d._id;
		return data;
	});
};

const setDeletionSkipFlag = async (id) => {
	return trashbinModel.findByIdAndUpdate(id, { skipDeletion: true });
};

const removeTrashbinDeletionFlags = async () => {
	return trashbinModel.updateMany({}, { skipDeletion: false });
};

module.exports = {
	createUserTrashbin,
	updateTrashbinByUserId,
	deleteExpiredData,
	getTrashbinObjectsByUserId,
	getExpiredTrashbinDataByScope,
	setDeletionSkipFlag,
	removeTrashbinDeletionFlags,
};
