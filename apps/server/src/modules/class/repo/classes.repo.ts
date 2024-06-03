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

	async findAllBySchoolId(schoolId: EntityId, sortOrder?: number): Promise<Class[]> {
		const classes: ClassEntity[] = await this.em.find(
			ClassEntity,
			{ schoolId: new ObjectId(schoolId) },
			{ orderBy: { gradeLevel: sortOrder, name: sortOrder } }
		);

		const mapped: Class[] = ClassMapper.mapToDOs(classes);

		return mapped;
	}

	async findAllByUserId(userId: EntityId): Promise<Class[]> {
		const classes: ClassEntity[] = await this.em.find(ClassEntity, {
			$or: [{ userIds: new ObjectId(userId) }, { teacherIds: new ObjectId(userId) }],
		});

		const mapped: Class[] = ClassMapper.mapToDOs(classes);

		return mapped;
	}

	public async getClassesByIds(classIds: EntityId[], sortOrder?: number): Promise<Class[]> {
		const classes = await this.em.find(
			ClassEntity,
			{ id: classIds },
			{ orderBy: { gradeLevel: sortOrder, name: sortOrder } }
		);

		const classDos = ClassMapper.mapToDOs(classes);

		return classDos;
	}

	async updateMany(classes: Class[]): Promise<void> {
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
