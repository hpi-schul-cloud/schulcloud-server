import { EntityId } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { roleFactory } from '@shared/testing/factory/role.factory';
import { TeamUser, TeamUserProps } from '@src/modules/teams/domain';
import { DoBaseFactory } from './domainobject';

class TeamUserDoFactory extends DoBaseFactory<TeamUser, TeamUserProps> {
	withUserId(userId: EntityId): this {
		const school = schoolFactory.build();
		const params: DeepPartial<TeamUserProps> = {
			user: userFactory.buildWithId({ school }, userId),
			school,
		};
		return this.params(params);
	}
}

export const teamUserDoFactory = TeamUserDoFactory.define(TeamUser, () => {
	const role = roleFactory.buildWithId();
	const school = schoolFactory.buildWithId();
	const user = userFactory.buildWithId({ roles: [role] });

	return new TeamUser({
		user,
		school,
		role,
	});
});
