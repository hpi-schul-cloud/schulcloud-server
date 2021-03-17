import type { ObjectId as MongooseObjectId } from 'mongoose';

export type ObjectId = string | MongooseObjectId;

export interface TrashBinResult<T> {
	trashBinData: {
		scope: string;
		data: T;
	};
	complete: boolean;
}
