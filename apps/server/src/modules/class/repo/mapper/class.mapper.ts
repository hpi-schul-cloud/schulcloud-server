import { ObjectId } from '@mikro-orm/mongodb';
import { Class } from '../../domain';
import { ClassSourceOptions } from '../../domain/class-source-options.do';
import { ClassEntity } from '../../entity';

export class ClassMapper {
	static mapToDO(entity: ClassEntity): Class {
		return new Class({
			id: entity.id,
			name: entity.name,
			schoolId: entity.schoolId.toHexString(),
			userIds: entity.userIds?.map((userId) => userId.toHexString()) || [],
			teacherIds: entity.teacherIds.map((teacherId) => teacherId.toHexString()),
			invitationLink: entity.invitationLink,
			year: entity.year?.toHexString(),
			gradeLevel: entity.gradeLevel,
			ldapDN: entity.ldapDN,
			successor: entity.successor?.toHexString(),
			source: entity.source,
			sourceOptions: new ClassSourceOptions({ tspUid: entity.sourceOptions?.tspUid }),
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		});
	}

	static mapToEntity(domainObject: Class): ClassEntity {
		return new ClassEntity({
			id: domainObject.id,
			name: domainObject.name,
			schoolId: new ObjectId(domainObject.schoolId),
			teacherIds: domainObject.teacherIds.map((teacherId) => new ObjectId(teacherId)),
			userIds: domainObject.userIds?.map((userId) => new ObjectId(userId)),
			invitationLink: domainObject.invitationLink,
			year: domainObject.year !== undefined ? new ObjectId(domainObject.year) : undefined,
			gradeLevel: domainObject.gradeLevel,
			ldapDN: domainObject.ldapDN,
			successor: domainObject.successor !== undefined ? new ObjectId(domainObject.successor) : undefined,
			source: domainObject.source,
			sourceOptions: domainObject.sourceOptions,
		});
	}

	static mapToDOs(entities: ClassEntity[]): Class[] {
		return entities.map((entity) => this.mapToDO(entity));
	}

	static mapToEntities(domainObjects: Class[]): ClassEntity[] {
		return domainObjects.map((domainObject) => this.mapToEntity(domainObject));
	}
}
