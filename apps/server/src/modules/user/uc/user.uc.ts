import { Injectable } from '@nestjs/common';
import { ResolvedUser } from '@shared/domain/entity';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { ResolvedUserMapper } from '../mapper';
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
