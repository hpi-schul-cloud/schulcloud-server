import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
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

		const usersByRole = await this.em.getConnection().aggregate<UsersByRole>('users', pipeline);

		return usersByRole;
	}
}
