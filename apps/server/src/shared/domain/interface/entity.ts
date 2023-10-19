import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@shared/domain/entity/school.entity';

export interface IEntity {
	_id: ObjectId;
	id: string;
}

export interface IEntityWithTimestamps extends IEntity {
	createdAt: Date;
	updatedAt: Date;
}

export interface IEntityWithSchool extends IEntity {
	school: SchoolEntity;
}
