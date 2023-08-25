import { Injectable } from '@nestjs/common';

import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain';
import { ClassEntity } from '../entity';

@Injectable()
export class ClassesRepo {
	constructor(private readonly em: EntityManager) {}

	async findAllByUserId(userId: EntityId): Promise<ClassEntity[]> {
		const classes: ClassEntity[] = await this.em.find(ClassEntity, { userIds: new ObjectId(userId) });

		return classes;
	}

	async updateMany(classes: ClassEntity[]): Promise<void> {
		await this.em.persistAndFlush(classes);
	}
}
