import { Role } from '@modules/role/repo';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { TeamEntity, TeamProperties, TeamUserEntity } from '../repo';
import { teamUserFactory } from './teamuser.factory';

class TeamFactory extends BaseFactory<TeamEntity, TeamProperties> {
	public withRoleAndUserId(role: Role, userId: string): this {
		const params: DeepPartial<TeamProperties> = {
			teamUsers: [teamUserFactory.withRoleAndUserId(role, userId).buildWithId()],
		};
		return this.params(params);
	}

	public withTeamUser(teamUser: TeamUserEntity[]): this {
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
