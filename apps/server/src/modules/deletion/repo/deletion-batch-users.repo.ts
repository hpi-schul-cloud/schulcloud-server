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

@Injectable()
export class DeletionBatchUsersRepo {
	constructor(private readonly em: EntityManager) {}

	public async countUsersByRole(userIds: EntityId[]): Promise<UsersCountByRole[]> {
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
				$unwind: '$roles',
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
					userCount: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					roleName: '$_id',
					userCount: 1,
				},
			},
		];

		const usersByRole = await this.em.getConnection().aggregate<UsersCountByRole>('users', pipeline);

		return usersByRole;
	}

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
				$unwind: '$roles',
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
					userIds: { $push: '$_id' },
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
}
