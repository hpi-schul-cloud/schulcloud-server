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
		const resultTeamUser = entity.teamUsers.find((teamUser: TeamUser) => teamUser.user.id === user.id);
		if (resultTeamUser) {
			hasPermission = this.utils.hasAllPermissionsByRole(resultTeamUser.role, context.requiredPermissions);
		}
		return hasPermission;
	}
}
