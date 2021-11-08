import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';

@Injectable()
export class UserRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<User> {
		const user = await this.em.findOneOrFail(User, { id });
		return user;
	}
}
