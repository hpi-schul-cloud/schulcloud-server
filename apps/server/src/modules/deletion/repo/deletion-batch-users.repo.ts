import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

type UserWithRoles = {
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
								roles: { $map: { input: { $ifNull: ['$roles', []] }, as: 'r', in: { $toString: '$$r' } } },
							},
						},
					],
					withoutAllowedRole: [
						{ $match: { roles: { $nin: allowedRoleIds } } },
						{
							$project: {
								_id: 0,
								id: { $toString: '$_id' },
								roles: { $map: { input: { $ifNull: ['$roles', []] }, as: 'r', in: { $toString: '$$r' } } },
							},
						},
					],
				},
			},
		];

		const [result] = await this.em.getCollection(User).aggregate<GroupedUserIdsByRoles>(pipeline).toArray();

		return result;
	}

	private async getRoleObjectIdsByNames(roleNames: RoleName[]): Promise<ObjectId[]> {
		const roles = await this.em
			.getCollection(Role)
			.aggregate<{ _id: ObjectId }>([{ $match: { name: { $in: roleNames } } }, { $project: { _id: 1 } }])
			.toArray();
		const roleObjectIds = roles.map((r) => r._id);

		return roleObjectIds;
	}
}
