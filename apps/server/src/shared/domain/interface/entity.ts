import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';

export interface IEntity {
	_id: ObjectId;
	id: string;
}

export interface IEntityWithTimestamps extends IEntity {
	createdAt: Date;
	updatedAt: Date;
}

export interface EntityWithSchool extends IEntity {
	school: SchoolEntity;
}
