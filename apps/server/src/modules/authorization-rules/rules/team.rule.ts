import {
	Action,
	AuthorizationContext,
	AuthorizationHelper,
	AuthorizationInjectionService,
	Rule,
} from '@modules/authorization';
import { TeamEntity, TeamUserEntity } from '@modules/team/repo';
import { Role } from '@modules/role/repo';
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

	private hasReadAccess(user: User, team: TeamEntity, context: AuthorizationContext): boolean {
		const hasTeamRolePermission = this.hasRequiredTeamPermissions(user, team, context);
		const hasInstanceReadOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.TEAM_VIEW,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
		]);

		return hasInstanceReadOperationPermission || hasTeamRolePermission;
	}

	private hasWriteAccess(user: User, team: TeamEntity, context: AuthorizationContext): boolean {
		const hasTeamRolePermission = this.hasRequiredTeamPermissions(user, team, context);
		const hasInstanceWriteOperationPermission = this.authorizationHelper.hasAllPermissions(user, [
			Permission.TEAM_EDIT,
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
		]);

		return hasInstanceWriteOperationPermission || hasTeamRolePermission;
	}

	private hasRequiredTeamPermissions(user: User, team: TeamEntity, context: AuthorizationContext): boolean {
		const teamRole = this.getTeamUserRole(user, team);
		const hasTeamRolePermission = teamRole
			? this.authorizationHelper.hasAllPermissionsByRole(teamRole, context.requiredPermissions)
			: false;

		return hasTeamRolePermission;
	}

	private getTeamUserRole(user: User, team: TeamEntity): Role | undefined {
		const teamUser = team.teamUsers.find((teamUser: TeamUserEntity) => teamUser.user.id === user.id);
		const role = teamUser?.role;

		return role;
	}
}
