import { Role } from '@shared/domain/entity/role.entity';
import { ITeamProperties, TeamEntity, TeamUserEntity } from '@shared/domain/entity/team.entity';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { teamUserFactory } from './teamuser.factory';

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
