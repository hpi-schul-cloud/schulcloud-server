import { ObjectId } from '@mikro-orm/mongodb';

export type FileFilerecord = {
	_id: ObjectId;
	fileId: ObjectId;
	filerecordId: ObjectId;
	error: string;
};
