import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { User as UserEntity } from '@shared/domain/entity';
import { RoleDto } from '@src/modules/role';
import { School } from '@src/modules/school';
import { User } from '../domain/user';
import { UserRepo } from '../uc/interface/user.repo.interface';
import { UserListQuery } from '../uc/query/user-list.query';
import { UserMapper } from './mapper/user.mapper';

@Injectable()
export class UserMikroOrmRepo implements UserRepo {
	constructor(private readonly em: EntityManager) {}

	public async getAndCountUsersBySchoolAndRole(
		school: School,
		role: RoleDto,
		query: UserListQuery
	): Promise<[User[], number]> {
		const orderBy = query.sortBy && { [query.sortBy]: query.sortOrder };

		const [entities, total] = await this.em.findAndCount(
			UserEntity,
			{ school: school.id, roles: role.id },
			{ limit: query.limit, offset: query.offset, orderBy }
		);

		const users = UserMapper.mapToDos(entities);

		return [users, total];
	}

	public async getUsersByIds(ids: string[], school: School, role: RoleDto, query: UserListQuery): Promise<User[]> {
		const orderBy = query.sortBy && { [query.sortBy]: query.sortOrder };

		const entities = await this.em.find(
			UserEntity,
			{ school: school.id, roles: role.id, id: ids },
			{ limit: query.limit, offset: query.offset, orderBy }
		);

		const users = UserMapper.mapToDos(entities);

		return users;
	}

	public async getUsersByIdsInOrderOfIds(
		ids: string[],
		query: UserListQuery,
		limit?: number,
		offset?: number
	): Promise<User[]> {
		const objectIds = ids.map((id) => new ObjectId(id));

		// Aggregation inspired by https://stackoverflow.com/a/42293303/11854580
		const result = await this.em.aggregate(UserEntity, [
			{ $match: { _id: { $in: objectIds } } },
			{ $addFields: { __order: { $indexOfArray: [objectIds, '$_id'] } } },
			{ $sort: { __order: 1 } },
			{ $skip: offset ?? query.offset },
			{ $limit: limit ?? query.limit },
			// It is necessary to add the id field here because the result does not contain MikroOrm entities with the id prop.
			{ $addFields: { id: { $toString: '$_id' } } },
		]);

		const resultAsEntities = result as UserEntity[];

		const users = UserMapper.mapToDos(resultAsEntities);

		return users;
	}

	public async getAndCountUsersExceptWithIds(
		idsToOmit: string[],
		school: School,
		role: RoleDto,
		query: UserListQuery,
		limit?: number,
		offset?: number
	): Promise<[User[], number]> {
		const [entities, total] = await this.em.findAndCount(
			UserEntity,
			{ school: school.id, roles: role.id, id: { $nin: idsToOmit } },
			{ limit: limit ?? query.limit, offset: offset ?? query.offset }
		);

		const users = UserMapper.mapToDos(entities);

		return [users, total];
	}

	public async countUsers(school: School, role: RoleDto): Promise<number> {
		const total = await this.em.count(UserEntity, { school: school.id, roles: role.id });

		return total;
	}
}
