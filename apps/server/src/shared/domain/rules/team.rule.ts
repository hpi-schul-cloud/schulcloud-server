import { Injectable } from '@nestjs/common';
import type { User } from '@shared/domain';
// currently impossible to resolve
// eslint-disable-next-line import/no-cycle
import { Team } from '../entity/team.entity';
import { IPermissionContext } from '../interface/permission';
import { BasePermission } from './base-permission';

@Injectable()
export class TeamRule extends BasePermission<Team> {
	// defined by Basetype
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public isApplicable(user: User, entity: Team, context?: IPermissionContext): boolean {
		return entity instanceof Team;
	}

	public hasPermission(user: User, entity: Team, context: IPermissionContext): boolean {
		console.log(user.id);
		console.log(entity.userIds[0].role === user.roles[0]);
		console.log(entity.userIds[0].userId === user);
		const validTeamUsers = entity.userIds.filter((teamUser) => {
			return context.requiredPermissions.some((p) => teamUser.role.permissions.includes(p));
		});
		return (
			validTeamUsers.length > 0 &&
			validTeamUsers[0].userId === user &&
			this.utils.hasAllPermissions(user, context.requiredPermissions)
		);
	}
}
