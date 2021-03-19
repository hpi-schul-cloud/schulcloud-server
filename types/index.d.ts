import type { ObjectId as MongooseObjectId } from 'mongoose';

/**
 * ObjectIds are either a string or an ObjectId from Mongoose.
 */
export type ObjectId = string | MongooseObjectId;

export interface TrashBinResult<T> {
	trashBinData: {
		scope: string;
		data: T;
	};
	complete: boolean;
}
