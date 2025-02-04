import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export type UserIdsByRole = {
	roleName: {
		id: EntityId;
		name: string;
	};
	userIds: EntityId[];
};

export type UsersByRole = {
	roleName: string;
	userCount: number;
};

@Injectable()
export class DeletionBatchSummaryRepo {
	constructor(private readonly em: EntityManager) {}

	public async countUsersByRole(userIds: EntityId[]): Promise<UsersByRole[]> {
		const pipeline = [
			{
				$match: {
					_id: { $in: userIds },
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

		const usersByRole = await this.em.getConnection().aggregate<UsersByRole>('users', pipeline);

		return usersByRole;
	}

	public async getUsersByRole(): Promise<UserIdsByRole[]> {
		const pipeline = [
			// {
			// 	$match: {
			// 		_id: {
			// 			$in: [
			// 				/* list of user ids */
			// 			],
			// 		},
			// 	},
			// },
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
					_id: {
						roleId: '$roleDetails._id',
						roleName: '$roleDetails.name',
					},
					userIds: { $push: '$_id' },
				},
			},
			{
				$project: {
					_id: 0,
					role: {
						id: { $toString: '$_id.roleId' },
						name: '$_id.roleName',
					},
					userIds: { $map: { input: '$userIds', as: 'id', in: { $toString: '$$id' } } },
				},
			},
		];

		const usersByRole = await this.em.getConnection().aggregate<UserIdsByRole>('users', pipeline);

		return usersByRole;
	}
}
