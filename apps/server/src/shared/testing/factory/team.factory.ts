import { ITeamProperties, Role, Team } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { teamUserFactory } from '@shared/testing/factory/teamuser.factory';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { roleFactory } from '@shared/testing/factory/role.factory';

class TeamFactory extends BaseFactory<Team, ITeamProperties> {
	withRoleAndUserId(role: Role, userId: string): this {
		const params: DeepPartial<ITeamProperties> = {
			teamUsers: [teamUserFactory.withRoleAndUserId(role, userId).buildWithId()],
		};
		return this.params(params);
	}
}

export const teamFactory = TeamFactory.define(Team, ({ sequence }) => {
	const role = roleFactory.buildWithId();
	const schoolId = schoolFactory.buildWithId();
	const userId = userFactory.buildWithId({ roles: [role] });
	return {
		name: `team #${sequence}`,
		teamUsers: [
			{
				userId,
				schoolId,
				role,
			},
		],
	};
});
