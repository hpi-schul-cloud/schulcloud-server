import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BasePermission } from '@shared/domain/rules/base-permission';
import { TeamUser, Team, User } from '@shared/domain/entity';
import { IPermissionContext } from '@shared/domain/interface';

@Injectable()
export class TeamRule extends BasePermission<Team> {
	// defined by Basetype
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public isApplicable(user: User, entity: Team, context?: IPermissionContext): boolean {
		return entity instanceof Team;
	}

	public hasPermission(user: User, entity: Team, context: IPermissionContext): boolean {
		const resultTeamUser: TeamUser | undefined = entity.userIds.find((teamUser) => teamUser.userId.id === user.id);

		if (!resultTeamUser) {
			throw new InternalServerErrorException('Cannot find user in team');
		}

		const permissions: string[] = this.utils.resolveTeamPermissions(resultTeamUser);

		return context.requiredPermissions.every((permission) => permissions.includes(permission));
	}
}
