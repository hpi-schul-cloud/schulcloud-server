import { ObjectId } from '@mikro-orm/mongodb';
import { School } from '@shared/domain/entity/school.entity';

export interface IReferenceId {
	id: string;
}

export interface IEntity extends IReferenceId {
	_id: ObjectId;
	id: string;
}

export interface IEntityWithTimestamps extends IEntity {
	createdAt: Date;
	updatedAt: Date;
}

export interface IEntityWithSchool extends IEntity {
	school: School;
}
