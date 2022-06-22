import { Injectable } from '@nestjs/common';
import type { User } from '@shared/domain';
import { Team } from '../entity/team.entity';
import { IPermissionContext } from '../interface/permission';
import { BasePermission } from './base-permission';

@Injectable()
export class TeamRule extends BasePermission<Team> {
	public isApplicable(user: User, entity: Team, context?: IPermissionContext): boolean {
		return entity instanceof Team;
	}

	public hasPermission(user: User, entity: Team, context: IPermissionContext): boolean {
		const validTeamUsers = entity.userIds.filter((teamUser) => {
			return teamUser.userId === user && context.requiredPermissions.some((p) => teamUser.role.permissions.includes(p));
		});

		return validTeamUsers.length > 0 && this.utils.hasAllPermissions(user, context.requiredPermissions);
	}
}
