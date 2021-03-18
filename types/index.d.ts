import type { ObjectId as MongooseObjectId } from 'mongoose';

/**
 * we allow object id's to be a string or the mongoose object id.
 */
export type ObjectId = string | MongooseObjectId;

export interface TrashBinResult<T> {
	trashBinData: {
		scope: string;
		data: T;
	};
	complete: boolean;
}
