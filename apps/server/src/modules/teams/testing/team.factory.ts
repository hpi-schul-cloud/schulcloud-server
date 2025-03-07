import { Role } from '@shared/domain/entity';
import { DeepPartial } from 'fishery';
import { BaseFactory } from '../../../testing/factory/base.factory';
import { teamUserFactory } from '../../../testing/factory/teamuser.factory';
import { TeamEntity, TeamProperties, TeamUserEntity } from '../repo';

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
