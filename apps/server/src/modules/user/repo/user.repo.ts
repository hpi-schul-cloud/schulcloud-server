import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { User } from '../entity';

@Injectable()
export class UserRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId): Promise<User> {
		const user = await this.em.findOneOrFail(User, { id });
		return user;
	}
}
