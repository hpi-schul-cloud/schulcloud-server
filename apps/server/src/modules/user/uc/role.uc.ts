import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { IPermissionsAndRoles } from '../entity';
import { RoleRepo } from '../repo';

@Injectable()
export class RoleUC {
	constructor(private readonly roleRepo: RoleRepo) {}

	async resolvePermissionsByIdList(ids: EntityId[]): Promise<IPermissionsAndRoles> {
		const roles = await Promise.all(ids.map((id) => this.roleRepo.resolvePermissionsFromSubRolesById(id)));

		let permissions: string[] = [];
		roles.forEach((role) => {
			permissions = [...permissions, ...role.permissions];
		});
		permissions = [...new Set(permissions)];

		return { roles, permissions };
	}
}
