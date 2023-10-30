import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { Class } from '../domain/class.do';
import { ClassEntity } from '../entity/class.entity';
import { ClassMapper } from './mapper/class.mapper';

@Injectable()
export class ClassesRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllBySchoolId(schoolId: EntityId): Promise<Class[]> {
		const classes: ClassEntity[] = await this.em.find(ClassEntity, { schoolId: new ObjectId(schoolId) });

		const mapped: Class[] = ClassMapper.mapToDOs(classes);

		return mapped;
	}

	async findAllByUserId(userId: EntityId): Promise<Class[]> {
		const classes: ClassEntity[] = await this.em.find(ClassEntity, { userIds: new ObjectId(userId) });

		const mapped: Class[] = ClassMapper.mapToDOs(classes);

		return mapped;
	}

	async updateMany(classes: Class[]): Promise<void> {
		const classesEntities = ClassMapper.mapToEntities(classes);
		const referencedEntities = classesEntities.map((classEntity) => this.em.getReference(ClassEntity, classEntity.id));

		await this.em.persistAndFlush(referencedEntities);
	}
}
