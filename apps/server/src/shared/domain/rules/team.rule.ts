import { Injectable } from '@nestjs/common';
import { IPermissionContext, BasePermission } from '@shared/domain';
import type { User } from '../entity';
import { Team } from '../entity';

@Injectable()
export class TeamRule extends BasePermission<Team> {
	public isApplicable(): boolean {
		return true;
	}

	public hasPermission(user: User, entity: Team, context: IPermissionContext): boolean {
		const validTeamUsers = entity.userIds.filter((teamUser) => {
			return teamUser.userId === user && context.requiredPermissions.some((p) => teamUser.role.permissions.includes(p));
		});

		return validTeamUsers.length > 0 && this.utils.hasAllPermissions(user, context.requiredPermissions);
	}
}
