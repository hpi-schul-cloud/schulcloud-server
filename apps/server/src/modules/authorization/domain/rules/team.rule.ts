import { Injectable } from '@nestjs/common';
import { TeamEntity, TeamUserEntity, User } from '@shared/domain/entity';
import { AuthorizationHelper } from '../service/authorization.helper';
import { AuthorizationContext, Rule } from '../type';

@Injectable()
export class TeamRule implements Rule<TeamEntity> {
	constructor(private readonly authorizationHelper: AuthorizationHelper) {}

	public isApplicable(user: User, object: unknown): boolean {
		return object instanceof TeamEntity;
	}

	public hasPermission(user: User, object: TeamEntity, context: AuthorizationContext): boolean {
		let hasPermission = false;
		const isTeamUser = object.teamUsers.find((teamUser: TeamUserEntity) => teamUser.user.id === user.id);
		if (isTeamUser) {
			hasPermission = this.authorizationHelper.hasAllPermissionsByRole(isTeamUser.role, context.requiredPermissions);
		}
		return hasPermission;
	}
}
