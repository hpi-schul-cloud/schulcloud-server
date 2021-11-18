import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { ResolvedUserMapper } from '../mapper';
import { ResolvedUser } from '../controller/dto/ResolvedUser.dto';
import { RoleUC } from './role.uc';

@Injectable()
// TODO: this is a domain service and must move to right place. It combine the repo roles and users
export class UserUC {
	constructor(private readonly userRepo: UserRepo, private readonly roleUC: RoleUC) {}

	async getUserWithPermissions(userId: EntityId): Promise<ResolvedUser> {
		const user = await this.userRepo.findById(userId);
		const roles = user.roles.getItems();
		const resolved = await this.roleUC.resolvePermissionsByRoles(roles);

		const resolvedUser = ResolvedUserMapper.mapToResponse(user, resolved.permissions, resolved.roles);
		return resolvedUser;
	}
}
