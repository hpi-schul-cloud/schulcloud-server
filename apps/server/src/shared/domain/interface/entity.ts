import { ObjectId } from '@mikro-orm/mongodb';
export interface IEntity {
	_id: ObjectId;
	id: string;
}
