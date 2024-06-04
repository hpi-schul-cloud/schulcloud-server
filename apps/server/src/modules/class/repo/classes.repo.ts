import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { EntityId } from '@shared/domain/types';
import { Class } from '../domain';
import { ClassEntity } from '../entity';
import { ClassMapper } from './mapper';

@Injectable()
export class ClassesRepo {
	constructor(private readonly em: EntityManager) {}

	public async findAllBySchoolId(schoolId: EntityId, sortOrder?: number): Promise<Class[]> {
		const classEntities = await this.em.find(
			ClassEntity,
			{ schoolId: new ObjectId(schoolId) },
			{ orderBy: { gradeLevel: sortOrder, name: sortOrder } }
		);

		const classes = ClassMapper.mapToDOs(classEntities);

		return classes;
	}

	public async findAllByUserId(userId: EntityId): Promise<Class[]> {
		const classEntities = await this.em.find(ClassEntity, {
			$or: [{ userIds: new ObjectId(userId) }, { teacherIds: new ObjectId(userId) }],
		});

		const classes = ClassMapper.mapToDOs(classEntities);

		return classes;
	}

	// TODO: add SortOrder enum with default order
	// classes has an index at schoolId, to use them will increase performance
	// schoolYear class.year is missed in request as option  ..but no index is set for this key, only a kombined key that not work for this query
	// ..but school+year sound like a good combined key for the performance
	// schoolId: EntityId, // schoolYear?: EntityId,
	// gradeLevel enum 1 bis 13
	public async getClassesByIdsSchoolAndSchoolYear(
		classIds: EntityId[],
		schoolId: EntityId,
		schoolYear?: EntityId,
		sortOrder?: number
	): Promise<Class[]> {
		const classIdsArray = Array.isArray(classIds) ? classIds : [classIds];
		const uniqueClassIds = [...new Set(classIdsArray)];
		const objectIds = uniqueClassIds.map((id: EntityId) => new ObjectId(id));

		const classEntities = await this.em.find(
			ClassEntity,
			{ _id: { $in: objectIds }, schoolId: new ObjectId(schoolId), year: new ObjectId(schoolYear) },
			{ orderBy: { gradeLevel: sortOrder, name: sortOrder } }
		);

		const classes = ClassMapper.mapToDOs(classEntities);

		return classes;
	}

	public async updateMany(classes: Class[]): Promise<void> {
		const classMap: Map<string, Class> = new Map<string, Class>(
			classes.map((clazz: Class): [string, Class] => [clazz.id, clazz])
		);

		const existingEntities: ClassEntity[] = await this.em.find(ClassEntity, {
			id: { $in: Array.from(classMap.keys()) },
		});

		if (existingEntities.length < classes.length) {
			const missingEntityIds: string[] = Array.from(classMap.keys()).filter(
				(classId) => !existingEntities.find((entity) => entity.id === classId)
			);

			throw new NotFoundLoggableException(Class.name, { id: missingEntityIds.toString() });
		}

		existingEntities.forEach((entity) => {
			const updatedDomainObject: Class | undefined = classMap.get(entity.id);

			const updatedEntity: ClassEntity = ClassMapper.mapToEntity(updatedDomainObject as Class);

			this.em.assign(entity, updatedEntity);
		});

		await this.em.persistAndFlush(existingEntities);
	}
}
