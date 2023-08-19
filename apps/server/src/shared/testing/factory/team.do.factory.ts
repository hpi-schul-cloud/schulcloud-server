import { DeepPartial } from 'fishery';
import { Team, TeamProps, TeamUser } from '@src/modules/teams/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from './domainobject';
import { teamUserDoFactory } from './teamUser.do.factory';

class TeamDoFactory extends DoBaseFactory<Team, TeamProps> {
	withTeamUser(teamUser: TeamUser[]): this {
		const params: DeepPartial<TeamProps> = {
			userIds: teamUser,
		};
		return this.params(params);
	}
}

export const teamDoFactory = TeamDoFactory.define(Team, () => {
	return {
		id: new ObjectId().toHexString(),
		name: 'team',
		userIds: [teamUserDoFactory.buildWithId()],
		createdAt: new Date(2023, 6, 1),
		updatedAt: new Date(2023, 7, 1),
	};
});
