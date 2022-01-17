import { Injectable } from '@nestjs/common';
import { EntityId, User } from '@shared/domain';
import { BaseRepo } from '../base.repo';

@Injectable()
export class UserRepo extends BaseRepo<User> {
	async findById(id: EntityId): Promise<User> {
		const user = await this.em.findOneOrFail(User, { id });
		return user;
	}
}
