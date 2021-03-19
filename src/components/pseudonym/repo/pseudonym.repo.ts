import type { ObjectId } from '../../../../types';

import { PseudonymModel, Pseudonym } from './db/pseudonym';
import { DeleteManyResult, deleteManyResult } from '../../helper/repo.helper';
import { validateObjectId } from '../../helper/validation.helper';

const byUserFilter = (userId: ObjectId): { userId: ObjectId } => ({ userId });

/**
 * Return pseudonyms for userId
 * @param userId
 */
const getPseudonymsForUser = async (userId: ObjectId): Promise<Pseudonym[]> => {
	validateObjectId({ userId });
	return PseudonymModel.find(byUserFilter(userId)).lean().exec();
};

/**
 * Removes all pseudonyms for userId
 * @param {String|ObjectId} userId
 */
const deletePseudonymsForUser = async (userId: ObjectId): Promise<DeleteManyResult> => {
	validateObjectId({ userId });
	const deleteResult = await PseudonymModel.deleteMany(byUserFilter(userId)).lean().exec();
	return deleteManyResult(deleteResult);
};

export { getPseudonymsForUser, deletePseudonymsForUser };
