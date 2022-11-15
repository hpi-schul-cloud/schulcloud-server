import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Team, TeamUser, User } from '@shared/domain/entity';
import { IAuthorizationContext } from '@shared/domain/interface';
import { BaseRule } from '@shared/domain/rules/base-rule';

@Injectable()
export class TeamRule extends BaseRule<Team> {
	public isApplicable(user: User, entity: Team): boolean {
		return entity instanceof Team;
	}

	public hasPermission(user: User, entity: Team, context: IAuthorizationContext): boolean {
		const resultTeamUser: TeamUser | undefined = entity.teamUsers.find(
			(teamUser: TeamUser) => teamUser.user.id === user.id
		);

		if (!resultTeamUser) {
			throw new InternalServerErrorException('Cannot find user in team');
		}

		const permissions: string[] = this.resolveTeamPermissions(resultTeamUser);
		return context.requiredPermissions.every((permission) => permissions.includes(permission));
	}

	private resolveTeamPermissions(teamUser: TeamUser): string[] {
		const rolesAndPermissions = this.utils.resolvePermissionsByRoles([teamUser.role]);

		return rolesAndPermissions;
	}
}
