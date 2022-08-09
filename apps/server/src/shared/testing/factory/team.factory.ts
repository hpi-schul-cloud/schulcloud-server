import { ITeamProperties, Role, Team } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { teamUserFactory } from '@shared/testing/factory/teamuser.factory';
import { BaseFactory } from '@shared/testing/factory/base.factory';

class TeamFactory extends BaseFactory<Team, ITeamProperties> {
	withRoleAndUserId(role: Role, userId: string): this {
		const params: DeepPartial<ITeamProperties> = {
			teamUsers: [teamUserFactory.withRoleAndUserId(role, userId).buildWithId()],
		};
		return this.params(params);
	}
}

export const teamFactory = TeamFactory.define(Team, ({ sequence }) => {
	return {
		name: `team #${sequence}`,
		teamUsers: [teamUserFactory.buildWithId()],
	};
});
