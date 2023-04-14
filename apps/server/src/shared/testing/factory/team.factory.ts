import { ITeamProperties, Role, Team, TeamUser } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { teamUserFactory } from '@shared/testing/factory/teamuser.factory';
import { BaseEntityTestFactory } from './base-entity-test.factory';

class TeamFactory extends BaseEntityTestFactory<Team, ITeamProperties> {
	withRoleAndUserId(role: Role, userId: string): this {
		const params: DeepPartial<ITeamProperties> = {
			teamUsers: [teamUserFactory.withRoleAndUserId(role, userId).buildWithId()],
		};
		return this.params(params);
	}

	withTeamUser(teamUser: TeamUser): this {
		const params: DeepPartial<ITeamProperties> = {
			teamUsers: [teamUser],
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
