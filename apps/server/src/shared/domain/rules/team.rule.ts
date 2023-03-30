import { Injectable } from '@nestjs/common';
import { Team, TeamUser, User } from '@shared/domain/entity';
import { AuthorizationContext } from '@shared/domain/interface';
import { BasePermission } from '@shared/domain/rules/base-permission';

@Injectable()
export class TeamRule extends BasePermission<Team> {
	public isApplicable(user: User, entity: Team): boolean {
		return entity instanceof Team;
	}

	public hasPermission(user: User, entity: Team, context: AuthorizationContext): boolean {
		let hasPermission = false;
		const isTeamUser = entity.teamUsers.find((teamUser: TeamUser) => teamUser.user.id === user.id);
		if (isTeamUser) {
			hasPermission = this.utils.hasAllPermissionsByRole(isTeamUser.role, context.requiredPermissions);
		}
		return hasPermission;
	}
}
