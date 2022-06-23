import { ObjectId } from '@mikro-orm/mongodb';

export type FileFileRecord = {
	_id: ObjectId;
	fileId: ObjectId;
	filerecordId: ObjectId;
	error: string;
};
