import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { User as UserEntity } from '@shared/domain/entity';
import { User } from '../domain/user';
import { UserListQuery } from '../uc/query/user-list.query';
import { UserMapper } from './mapper/user.mapper';

@Injectable()
export class UserMikroOrmRepo {
	constructor(private readonly em: EntityManager) {}

	public async getAndCountUsers(query: UserListQuery): Promise<[User[], number]> {
		const [entities, total] = await this.em.findAndCount(
			UserEntity,
			{ school: query.schoolId, roles: query.roleId },
			{ limit: query.limit, offset: query.offset }
		);

		const users = UserMapper.mapToDos(entities);

		return [users, total];
	}

	public async getUsersByIds(ids: string[], query: UserListQuery): Promise<User[]> {
		const entities = await this.em.find(UserEntity, { id: ids }, { limit: query.limit, offset: query.offset });

		const users = UserMapper.mapToDos(entities);

		return users;
	}
}
