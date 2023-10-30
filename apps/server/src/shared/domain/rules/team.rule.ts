import { Injectable } from '@nestjs/common';
import { AuthorizationHelper } from '@src/modules/authorization/authorization.helper';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { Rule } from '@src/modules/authorization/types/rule.interface';
import { TeamEntity, TeamUserEntity } from '../entity/team.entity';
import { User } from '../entity/user.entity';

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
