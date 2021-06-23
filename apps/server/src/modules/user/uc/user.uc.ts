import { Injectable } from '@nestjs/common';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { ResolvedUserMapper } from '../mapper';
import { ResolvedUser } from '../controller/dto/ResolvedUser.dto';

import { UserRepo, RoleRepo } from '../repo';

// TODO: IUserWithPermission as return
@Injectable()
export class UserUC {
	constructor(private userRepo: UserRepo, private roleRepo: RoleRepo) {}

	async getUserWithPermissions(currentUser: ICurrentUser): Promise<ResolvedUser> {
		const [user, resolved] = await Promise.all([
			this.userRepo.findById(currentUser.userId),
			this.roleRepo.resolvePermissionsByIdList(currentUser.roles),
		]);

		const resolvedUser = ResolvedUserMapper.mapToResponse(user, resolved.permissions, resolved.roles);
		return resolvedUser;
	}
}
