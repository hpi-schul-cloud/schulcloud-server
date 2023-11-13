import { Injectable } from '@nestjs/common';
import { EntityId, User, PermissionContextEntity, Role, Permission } from '@shared/domain';
import { UserRepo, PermissionContextRepo } from '@shared/repo';
import { ObjectId } from 'bson';

@Injectable()
export class PermissionContextService {
	constructor(private readonly userRepo: UserRepo, private readonly permissionContextRepo: PermissionContextRepo) {}

	private static async getNestedRoleIds(role: Role): Promise<string[]> {
		let roleIds: EntityId[] = [role.id];
		const roles = role.roles.getItems();
		if (roles.length === 0) return roleIds;

		const nestedRoleIdsPromise = roles.map((r) => this.getNestedRoleIds(r));

		const nestedRoleIds = await Promise.all(nestedRoleIdsPromise);

		roleIds = [...roleIds, ...nestedRoleIds.flat()];

		return roleIds;
	}

	private static resolveSinglePermissionContext(
		permissionCtx: PermissionContextEntity,
		applicableRoleIds: string[]
	): { permissions: string[]; permissionListBelongsToUser: boolean } {
		let permissionListBelongsToUser = false;
		let aggregatedPermissions: string[] = [];

		if (permissionCtx.parent_context) {
			const { permissions: parentPermissions, permissionListBelongsToUser: parentPermissionListBelongsToUser } =
				this.resolveSinglePermissionContext(permissionCtx.parent_context, applicableRoleIds);
			aggregatedPermissions = aggregatedPermissions.concat(parentPermissions);
			permissionListBelongsToUser = permissionListBelongsToUser || parentPermissionListBelongsToUser;
		}

		if (permissionCtx.role && applicableRoleIds.includes(permissionCtx.role?.id)) {
			aggregatedPermissions = aggregatedPermissions.concat(permissionCtx.role.resolvePermissions());
			permissionListBelongsToUser = true;
		}

		aggregatedPermissions = aggregatedPermissions.concat(permissionCtx.included_permissions);
		aggregatedPermissions = aggregatedPermissions.filter(
			// NOTE: casting needed as I could not find a better way to do this
			//       once all permissions are uses as enums instead of strings the casting can be removed
			(permission) => !permissionCtx.excluded_permissions.includes(permission as Permission)
		);

		aggregatedPermissions = [...new Set(aggregatedPermissions)];

		return { permissions: aggregatedPermissions, permissionListBelongsToUser };
	}

	public async resolvePermissions(user: User, contextReference: ObjectId): Promise<string[]> {
		// NOTE: the contextReference is the _id to a collection that needs authorization
		const permissionCtxEntities = await this.permissionContextRepo.findByContextReference(contextReference);

		const userRoleIdsPromise = user.roles
			.getItems()
			.map(async (role) => PermissionContextService.getNestedRoleIds(role));

		const userRoleIds = (await Promise.all(userRoleIdsPromise)).flat();

		// filter out permission contexts that are not related to the user
		const applicablePermissions = permissionCtxEntities
			.map((ctx) => {
				const resolvedValues = PermissionContextService.resolveSinglePermissionContext(ctx, userRoleIds);
				return resolvedValues;
			})
			.filter((values) => values.permissionListBelongsToUser)
			.flatMap((values) => values.permissions);

		return applicablePermissions;
	}
}
