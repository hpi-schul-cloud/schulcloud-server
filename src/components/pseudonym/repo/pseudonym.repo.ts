import type { ObjectId } from '../../../../types';

import Pseudonym, { PseudonymModel } from '../../../services/pseudonym/model';
import { DeleteManyResult, deleteManyResult } from '../../helper/repo.helper';
import { validateObjectId } from '../../helper/validation.helper';

const byUserFilter = (userId: ObjectId): { userId: ObjectId } => ({ userId });

/**
 * Return pseudonyms for userId
 * @param userId
 */
const getPseudonymsForUser = async (userId: ObjectId): Promise<PseudonymModel[]> => {
	validateObjectId({ userId });
	return Pseudonym.find(byUserFilter(userId)).lean().exec();
};

/**
 * Removes all pseudonyms for userId
 * @param {String|ObjectId} userId
 */
const deletePseudonymsForUser = async (userId: ObjectId): Promise<DeleteManyResult> => {
	validateObjectId({ userId });
	const deleteResult = await Pseudonym.deleteMany(byUserFilter(userId)).lean().exec();
	return deleteManyResult(deleteResult);
};

export { getPseudonymsForUser, deletePseudonymsForUser };
