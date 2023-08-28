import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { ClassesRepo } from '../repo';
import { ClassEntity } from '../entity';

@Injectable()
export class ClassService {
	constructor(private readonly classesRepo: ClassesRepo) {}

	public async deleteUserDataFromClasses(userId: EntityId): Promise<number> {
		if (!userId) {
			throw new InternalServerErrorException('User id is missing');
		}

		const entities = await this.classesRepo.findAllByUserId(userId);

		const userIdAsObjectId = new ObjectId(userId);

		const updatedEntities: ClassEntity[] = entities.map((entity) => {
			if (entity.userIds !== undefined) {
				entity.userIds.filter((userId1) => userId1 !== userIdAsObjectId);
			}
			return entity;
		});

		await this.classesRepo.updateMany(updatedEntities);

		return updatedEntities.length;
	}
}
