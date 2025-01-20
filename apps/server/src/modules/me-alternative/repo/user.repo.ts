import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';

@Injectable()
export class UserRepo {
	constructor(private readonly em: EntityManager) {}

	public async getUserById(userId: string) {
		const user = this.em.findOneOrFail(User, { id: userId });

		return user;
	}
}
