import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export type UserIdsByRole = {
	roleName: string;
	userIds: EntityId[];
};

export type UsersCountByRole = {
	roleName: string;
	userCount: number;
};

export type UserWithRoles = {
	id: string;
	roles: string[];
};

@Injectable()
export class DeletionBatchUsersRepo {
	constructor(private readonly em: EntityManager) {}

	public async getUsersByRole(userIds: EntityId[]): Promise<UserIdsByRole[]> {
		if (userIds.length === 0) {
			return [];
		}
		const pipeline = [
			{
				$match: {
					_id: { $in: userIds.map((id) => new ObjectId(id)) },
				},
			},
			{
				$lookup: {
					from: 'roles',
					localField: 'roles',
					foreignField: '_id',
					as: 'roleDetails',
				},
			},
			{
				$unwind: '$roleDetails',
			},
			{
				$group: {
					_id: '$roleDetails.name',
					userIds: { $push: { $toString: '$_id' } },
				},
			},
			{
				$project: {
					_id: 0,
					roleName: '$_id',
					userIds: 1,
				},
			},
		];

		const usersByRole = await this.em.getConnection().aggregate<UserIdsByRole>('users', pipeline);

		return usersByRole;
	}

	public async getUsersWithRoles(userIds: EntityId[]): Promise<UserWithRoles[]> {
		if (userIds.length === 0) return [];

		const pipeline = [
			{
				$match: {
					_id: { $in: userIds.map((id) => new ObjectId(id)) },
				},
			},
			{
				$lookup: {
					from: 'roles',
					localField: 'roles',
					foreignField: '_id',
					as: 'roleDetails',
				},
			},
			{
				$project: {
					_id: 0,
					id: { $toString: '$_id' },
					roles: {
						$map: {
							input: '$roleDetails',
							as: 'role',
							in: '$$role.name',
						},
					},
				},
			},
		];

		const usersWithRoles = await this.em.getConnection().aggregate<UserWithRoles>('users', pipeline);

		return usersWithRoles;
	}
}
