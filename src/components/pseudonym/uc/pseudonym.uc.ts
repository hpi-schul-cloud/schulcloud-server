import { pseudonymRepo } from '../repo/index';
import { validateObjectId } from '../../helper/validation.helper';
import { trashBinResult } from '../../helper/uc.helper';
import { debug } from '../../../logger';

import { Pseudonym } from '../../../services/pseudonym/model';
import type { ObjectId, TrashBinResult } from '../../../../types';

const deletePseudonymsForUser = async (userId: ObjectId): Promise<TrashBinResult<Pseudonym[]>> => {
	validateObjectId({ userId });
	let complete = true;
	debug(`deleting user related pseudonyms started`, { userId });
	const pseudonyms = await pseudonymRepo.getPseudonymsForUser(userId);
	debug(`found ${pseudonyms.length} pseudonyms for the user to be removed`, { userId });
	if (pseudonyms.length !== 0) {
		const result = await pseudonymRepo.deletePseudonymsForUser(userId);
		complete = result.success;
		debug(`removed  ${result.deletedDocuments} pseudonyms`, { userId });
	}
	debug(`deleting user related pseudonyms finished`, { userId });
	return trashBinResult({ scope: 'pseudonyms', data: pseudonyms, complete });
};

const deleteUserData = [deletePseudonymsForUser];

export { deleteUserData };
