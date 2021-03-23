import { Trashbin, TrashbinModel } from './db/trashbin.schema';
import { ObjectId } from '../../../../types';

export type TrashbinScopeData = { scope: string; data: any };
export type TrashbinData = [TrashbinScopeData];

/**
 * Creates the trashbin document
 * @param {string} userId UserId of user to be deleted
 * @param {Object} data User data to be stored within trashbin
 * @return {trashbinModel} Trashbin document
 */
const createUserTrashbin = async (userId: ObjectId, data: TrashbinData): Promise<Trashbin> => {
	const trashbinData = {
		data,
		userId,
	};
	const trashbin = await TrashbinModel.create(trashbinData);
	return trashbin.toObject();
};

/**
 * Adds data to user trashbin document
 * @param {string} id Id of user trashbin document
 * @param {Object} data Data to be added/updated
 */
const updateTrashbinByUserId = async (userId: ObjectId, data: TrashbinScopeData): Promise<Trashbin | null> => {
	// TODO data was {} before
	// access trashbin model
	const trashbin = await TrashbinModel.findOneAndUpdate({ userId }, { $push: { data } }, { new: true })
		.sort({
			createdAt: -1,
		})
		.lean()
		.exec();
	return trashbin; // TODO what if null? throw not found instead?
};

export { createUserTrashbin, updateTrashbinByUserId };
