import { ITeamProperties, Role, TeamEntity, TeamUserEntity } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { teamUserFactory } from '@shared/testing/factory/teamuser.factory';
import { BaseFactory } from '@shared/testing/factory/base.factory';

class TeamFactory extends BaseFactory<TeamEntity, ITeamProperties> {
	withRoleAndUserId(role: Role, userId: string): this {
		const params: DeepPartial<ITeamProperties> = {
			teamUsers: [teamUserFactory.withRoleAndUserId(role, userId).buildWithId()],
		};
		return this.params(params);
	}

	withTeamUser(teamUser: TeamUserEntity[]): this {
		const params: DeepPartial<ITeamProperties> = {
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
