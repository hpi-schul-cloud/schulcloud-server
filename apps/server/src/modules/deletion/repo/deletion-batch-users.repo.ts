import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export type UserWithRoles = {
	id: EntityId;
	roleIds: EntityId[];
};

export type GroupedUserIdsByRoles = {
	withAllowedRole: UserWithRoles[];
	withoutAllowedRole: UserWithRoles[];
};

@Injectable()
export class DeletionBatchUsersRepo {
	constructor(private readonly em: EntityManager) {}

	public async groupUserIdsByAllowedRoles(
		userIds: EntityId[],
		allowedRoles: RoleName[]
	): Promise<GroupedUserIdsByRoles> {
		if (userIds.length === 0) {
			return {
				withAllowedRole: [],
				withoutAllowedRole: [],
			};
		}

		// Step 1: Get role IDs for the allowed role names
		const allowedRoleIds = await this.getRoleObjectIdsByNames(allowedRoles);

		// Step 2: Simplified aggregation using role IDs directly
		const pipeline = [
			{
				$match: {
					_id: { $in: userIds.map((id) => new ObjectId(id)) },
				},
			},
			{
				$facet: {
					withAllowedRole: [
						{ $match: { roles: { $in: allowedRoleIds } } },
						{
							$project: {
								_id: 0,
								id: { $toString: '$_id' },
								roles: { $map: { input: '$roles', as: 'r', in: { $toString: '$$r' } } },
							},
						},
					],
					withoutAllowedRole: [
						{ $match: { roles: { $nin: allowedRoleIds } } },
						{
							$project: {
								_id: 0,
								id: { $toString: '$_id' },
								roles: {
									$cond: {
										if: { $eq: ['$roles', null] },
										then: [],
										else: { $map: { input: '$roles', as: 'r', in: { $toString: '$$r' } } },
									},
								},
							},
						},
					],
				},
			},
		];

		const [result] = await this.em.getConnection().aggregate<GroupedUserIdsByRoles>('users', pipeline);

		return result;
	}

	private async getRoleObjectIdsByNames(roleNames: RoleName[]): Promise<ObjectId[]> {
		const roles = await this.em
			.getConnection()
			.aggregate<{ _id: ObjectId }>('roles', [{ $match: { name: { $in: roleNames } } }, { $project: { _id: 1 } }]);
		const roleObjectIds = roles.map((r) => r._id);

		return roleObjectIds;
	}
}
