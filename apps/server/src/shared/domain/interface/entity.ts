import { ObjectId } from '@mikro-orm/mongodb';
export interface IEntity {
	_id: ObjectId;
	id: string;
}

export interface IEntityWithTimestamps extends IEntity {
	createdAt: Date;
	updatedAt: Date;
}
