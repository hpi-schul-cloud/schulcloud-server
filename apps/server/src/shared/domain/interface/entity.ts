import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@shared/domain/entity/school.entity';

export interface EntityInterface {
	_id: ObjectId;
	id: string;
}

export interface EntityInterfaceWithTimestamps extends EntityInterface {
	createdAt: Date;
	updatedAt: Date;
}

export interface EntityWithSchool extends EntityInterface {
	school: SchoolEntity;
}
