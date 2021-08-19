import { Injectable } from '@nestjs/common';
import { ICurrentUser } from '@shared/domain';
import { ResolvedUserMapper } from '../mapper';
import { ResolvedUser } from '../controller/dto/ResolvedUser.dto';
import { RoleUC } from './role.uc';
import { UserRepo } from '../repo';

@Injectable()
export class UserUC {
	constructor(private readonly userRepo: UserRepo, private readonly roleUC: RoleUC) {}

	async getUserWithPermissions(currentUser: ICurrentUser): Promise<ResolvedUser> {
		const [user, resolved] = await Promise.all([
			this.userRepo.findById(currentUser.userId),
			this.roleUC.resolvePermissionsByIdList(currentUser.roles),
		]);

		const resolvedUser = ResolvedUserMapper.mapToResponse(user, resolved.permissions, resolved.roles);
		return resolvedUser;
	}
}
