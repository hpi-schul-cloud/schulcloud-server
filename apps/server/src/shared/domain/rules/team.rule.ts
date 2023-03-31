import { Injectable } from '@nestjs/common';
import { Team, TeamUser, User } from '@shared/domain/entity';
import { AuthorizationContext } from '@shared/domain/interface';
import { AuthorizationHelper } from './authorization.helper';

@Injectable()
export class TeamRule {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, entity: Team): boolean {
		return entity instanceof Team;
	}

	public hasPermission(user: User, entity: Team, context: AuthorizationContext): boolean {
		let hasPermission = false;
		const isTeamUser = entity.teamUsers.find((teamUser: TeamUser) => teamUser.user.id === user.id);
		if (isTeamUser) {
			hasPermission = this.authorizationHelper.hasAllPermissionsByRole(isTeamUser.role, context.requiredPermissions);
		}
		return hasPermission;
	}
}
