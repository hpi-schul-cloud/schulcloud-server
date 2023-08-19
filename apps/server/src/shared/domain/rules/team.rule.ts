import { Injectable } from '@nestjs/common';
import { TeamEntity, TeamUserEntity, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '@src/modules/authorization/types';

@Injectable()
export class TeamRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: TeamEntity): boolean {
		return entity instanceof TeamEntity;
	}

	public hasPermission(user: User, entity: TeamEntity, context: AuthorizationContext): boolean {
		let hasPermission = false;
		const isTeamUser = entity.teamUsers.find((teamUser: TeamUserEntity) => teamUser.user.id === user.id);
		if (isTeamUser) {
			hasPermission = this.authorizationHelper.hasAllPermissionsByRole(isTeamUser.role, context.requiredPermissions);
		}
		return hasPermission;
	}
}
