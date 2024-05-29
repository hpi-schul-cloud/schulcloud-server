import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity';
import { UserListQuery } from '../uc/query/user-list.query';
import { UserMapper } from './mapper/user.mapper';

@Injectable()
export class UserMikroOrmRepo {
	constructor(private readonly em: EntityManager) {}

	public async getUsers(query: UserListQuery) {
		const entities = await this.em.find(
			User,
			{ school: query.schoolId, roles: query.roleId },
			{ limit: query.limit, offset: query.offset }
		);

		const users = UserMapper.mapToDos(entities);

		return users;
	}
}
