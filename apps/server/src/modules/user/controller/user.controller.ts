import { ApiTags } from '@nestjs/swagger';

import { Controller, Get } from '@nestjs/common';
import { ICurrentUser, PermissionService } from '@shared/domain';

import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { UserRepo } from '@shared/repo';
import { ResolvedUser } from './dto/ResolvedUser.dto';
import { ResolvedUserMapper } from '../mapper';

@ApiTags('User')
@Authenticate('jwt')
@Controller('user')
export class UserController {
	constructor(private readonly userRepo: UserRepo, private readonly permissionService: PermissionService) {}

	@Get('me')
	async me(@CurrentUser() currentUser: ICurrentUser): Promise<ResolvedUser> {
		const user = await this.userRepo.findById(currentUser.userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		// only the root roles of the user get published
		const resolvedUser = ResolvedUserMapper.mapToResponse(user, permissions, user.roles.getItems());

		return resolvedUser;
	}
}
