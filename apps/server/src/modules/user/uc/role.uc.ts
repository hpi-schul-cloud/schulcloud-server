import { Injectable } from '@nestjs/common';
import { IPermissionsAndRoles, Role } from '@shared/domain';

import { RoleRepo } from '../repo';

@Injectable()
export class RoleUC {
	constructor(private readonly roleRepo: RoleRepo) {}

	async resolvePermissionsByRoles(inputRoles: Role[]): Promise<IPermissionsAndRoles> {
		const roles = await Promise.all(
			inputRoles.map((role) => this.roleRepo.resolvePermissionsFromSubRolesById(role.id))
		);

		let permissions: string[] = [];
		roles.forEach((role) => {
			permissions = [...permissions, ...role.permissions];
		});
		permissions = [...new Set(permissions)];

		return { roles, permissions };
	}
}
