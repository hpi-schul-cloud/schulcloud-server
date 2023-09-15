import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, User as UserEntity } from '@shared/domain';
import { User } from '../domain';
import { UserMapper } from './mapper';

@Injectable()
export class UserRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(userId: EntityId): Promise<User> {
		const user = await this.em.findOneOrFail(
			UserEntity,
			{ _id: new ObjectId(userId) },
			{ populate: ['school', 'roles'] }
		);
		return UserMapper.mapToDO(user);
	}
}
