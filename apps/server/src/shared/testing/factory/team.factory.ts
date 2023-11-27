import { Role, TeamEntity, TeamProperties, TeamUserEntity } from '@shared/domain';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { teamUserFactory } from '@shared/testing/factory/teamuser.factory';
import { DeepPartial } from 'fishery';

class TeamFactory extends BaseFactory<TeamEntity, TeamProperties> {
	withRoleAndUserId(role: Role, userId: string): this {
		const params: DeepPartial<TeamProperties> = {
			teamUsers: [teamUserFactory.withRoleAndUserId(role, userId).buildWithId()],
		};
		return this.params(params);
	}

	withTeamUser(teamUser: TeamUserEntity[]): this {
		const params: DeepPartial<TeamProperties> = {
			teamUsers: teamUser,
		};
		return this.params(params);
	}
}

export const teamFactory = TeamFactory.define(TeamEntity, ({ sequence }) => {
	return {
		name: `team #${sequence}`,
		teamUsers: [teamUserFactory.buildWithId()],
	};
});
