import { Injectable } from '@nestjs/common';
import { Team, TeamUser, User } from '@shared/domain/entity';
import { IPermissionContext } from '@shared/domain/interface';
import { BasePermission } from '@shared/domain/rules/base-permission';

@Injectable()
export class TeamRule extends BasePermission<Team> {
	public isApplicable(user: User, entity: Team): boolean {
		return entity instanceof Team;
	}

	public hasPermission(user: User, entity: Team, context: IPermissionContext): boolean {
		let hasPermission = false;
		const teamUser1 = entity.teamUsers.find((teamUser: TeamUser) => teamUser.user === user);
		if (teamUser1) {
			// populate don't work, eger must be added
			hasPermission = this.utils.hasAllPermissionsByRole(teamUser1.role, context.requiredPermissions);
		}
		return hasPermission;
	}
}
