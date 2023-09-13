import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Class } from '../domain';
import { ClassEntity } from '../entity';
import { ClassMapper } from './mapper';

@Injectable()
export class ClassesRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllBySchoolId(schoolId: EntityId): Promise<Class[]> {
		const classes: ClassEntity[] = await this.em.find(ClassEntity, { schoolId: new ObjectId(schoolId) });

		return ClassMapper.mapToDOs(classes);
	}

	async findAllByUserId(userId: EntityId): Promise<Class[]> {
		const classes: ClassEntity[] = await this.em.find(ClassEntity, { userIds: new ObjectId(userId) });
		return ClassMapper.mapToDOs(classes);
	}

	async updateMany(classes: Class[]): Promise<void> {
		const classesEntities = ClassMapper.mapToEntities(classes);
		const referencedEntities = classesEntities.map((classEntity) => this.em.getReference(ClassEntity, classEntity.id));

		await this.em.persistAndFlush(referencedEntities);
	}
}
