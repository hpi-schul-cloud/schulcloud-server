import { AuthorizationContext, AuthorizationHelper, AuthorizationInjectionService, Rule } from '@modules/authorization';
import { TeamEntity, TeamUserEntity } from '@modules/team/repo';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TeamRule implements Rule<TeamEntity> {
	constructor(
		private readonly authorizationHelper: AuthorizationHelper,
		authorisationInjectionService: AuthorizationInjectionService
	) {
		authorisationInjectionService.injectAuthorizationRule(this);
	}

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
