import { ITeamProperties, Role, Team, TeamUser } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { teamUserFactory } from '@shared/testing/factory/teamuser.factory';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { roleFactory } from '@shared/testing/factory/role.factory';

class TeamFactory extends BaseFactory<Team, ITeamProperties> {
	withTeamUsers(teamUsers: TeamUser[]): this {
		const params: DeepPartial<ITeamProperties> = {
			userIds: teamUsers,
		};
		return this.params(params);
	}

	withRoleAndUserId(role: Role, userId: string): this {
		const params: DeepPartial<ITeamProperties> = {
			userIds: [teamUserFactory.withRoleAndUserId(role, userId).buildWithId()],
		};
		return this.params(params);
	}
}

export const teamFactory = TeamFactory.define(Team, ({ sequence }) => {
	const role = roleFactory.build();
	const schoolId = schoolFactory.build();
	const userId = userFactory.build({ roles: [role] });
	return {
		name: `team #${sequence}`,
		userIds: [
			{
				userId,
				schoolId,
				role,
			},
		],
	};
});
