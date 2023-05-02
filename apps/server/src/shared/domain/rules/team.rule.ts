import { Injectable } from '@nestjs/common';
import { Team, TeamUser, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../../../modules/authorization/authorization.helper';
import { AuthorizationContext, Rule } from '../../../modules/authorization/types';

@Injectable()
export class TeamRule implements Rule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: Team): boolean {
		return entity instanceof Team;
	}

	public isAuthorized(user: User, entity: Team, context: AuthorizationContext): boolean {
		let hasPermission = false;
		const isTeamUser = entity.teamUsers.find((teamUser: TeamUser) => teamUser.user.id === user.id);
		if (isTeamUser) {
			hasPermission = this.authorizationHelper.hasAllPermissionsByRole(isTeamUser.role, context.requiredPermissions);
		}
		return hasPermission;
	}
}
