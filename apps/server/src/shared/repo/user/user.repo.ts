import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId, Role, User } from '@shared/domain';

@Injectable()
export class UserRepo {
	constructor(private readonly em: EntityManager) {}

	async findById(id: EntityId, populateRoles = false): Promise<User> {
		const user = await this.em.findOneOrFail(User, { id });

		if (populateRoles) {
			await this.em.populate(user, ['roles']);
			await this.populateRoles(user.roles.getItems());
		}

		return user;
	}

	private async populateRoles(roles: Role[]): Promise<void> {
		for (let i = 0; i < roles.length; i += 1) {
			const role = roles[i];
			if (!role.roles.isInitialized()) {
				// eslint-disable-next-line no-await-in-loop
				await this.em.populate(role, ['roles']);
			}
		}
	}
}
