import { Injectable } from '@nestjs/common';

import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { ClassEntity } from '../entity';
import { Class } from '../domain';
import { ClassMapper } from '../service/mapper';

@Injectable()
export class ClassesRepo {
	constructor(private readonly em: EntityManager, private readonly mapper: ClassMapper) {}

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
