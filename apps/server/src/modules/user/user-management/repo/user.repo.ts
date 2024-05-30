import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
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
		const entities = await this.em.find(
			UserEntity,
			{ school: query.schoolId, roles: query.roleId, id: ids },
			{ limit: query.limit, offset: query.offset }
		);

		const users = UserMapper.mapToDos(entities);

		return users;
	}

	public async getUsersByIdsInOrderOfIds(ids: string[], query: UserListQuery): Promise<User[]> {
		const objectIds = ids.map((id) => new ObjectId(id));

		// Aggregation inspired by https://stackoverflow.com/a/42293303/11854580
		const result = await this.em.aggregate(UserEntity, [
			{ $match: { _id: { $in: objectIds } } },
			{ $addFields: { __order: { $indexOfArray: [objectIds, '$_id'] } } },
			{ $sort: { __order: 1 } },
			{ $skip: query.offset },
			{ $limit: query.limit },
			// It is necessary to add the id field here because the result does not contain MikroOrm entities with the id prop.
			{ $addFields: { id: { $toString: '$_id' } } },
		]);

		const resultAsEntities = result as UserEntity[];

		const users = UserMapper.mapToDos(resultAsEntities);

		return users;
	}

	public async getUsersExceptWithIds(idsToOmit: string[], limit: number, query: UserListQuery) {
		const entities = await this.em.find(
			UserEntity,
			{ school: query.schoolId, roles: query.roleId, id: { $nin: idsToOmit } },
			{ limit }
		);

		const users = UserMapper.mapToDos(entities);

		return users;
	}

	public async countUsers(query: UserListQuery): Promise<number> {
		const total = await this.em.count(UserEntity, { school: query.schoolId, roles: query.roleId });

		return total;
	}
}
