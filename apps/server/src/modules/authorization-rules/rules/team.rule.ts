import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { TeamEntity, TeamUserEntity } from '@modules/team/repo';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';

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

	public hasPermission(user: User, team: TeamEntity, context: AuthorizationContext): boolean {
		let hasPermission = false;

		if (context.action === Action.read) {
			hasPermission = this.hasReadAccess(user, team, context);
		} else if (context.action === Action.write) {
			hasPermission = this.hasWriteAccess(user, team, context);
		} else {
			throw new NotImplementedException();
		}

		return hasPermission;
	}

	// TODO TEAM_VIEW and TEAM_EDIT permissions are added need to be checked
	private hasReadAccess(user: User, team: TeamEntity, context: AuthorizationContext): boolean {
		const isTeamUser = this.isTeamUser(user, team);
		const hasReadPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.TEAM_VIEW,
			...context.requiredPermissions,
		]);
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.TEAM_VIEW,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceReadOperationPermission || (hasReadPermission && isTeamUser);
	}

	private hasWriteAccess(user: User, team: TeamEntity, context: AuthorizationContext): boolean {
		const isTeamUser = this.isTeamUser(user, team);
		const hasWritePermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.TEAM_EDIT,
			...context.requiredPermissions,
		]);
		const hasInstanceWriteOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.TEAM_EDIT,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
			...context.requiredPermissions,
		]);

		return hasInstanceWriteOperationPermission || (hasWritePermission && isTeamUser);
	}

	private isTeamUser(user: User, team: TeamEntity): boolean {
		const isTeamUser = team.teamUsers.some((teamUser: TeamUserEntity) => teamUser.user.id === user.id);

		return isTeamUser;
	}
}
