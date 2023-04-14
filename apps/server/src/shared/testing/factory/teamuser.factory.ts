import { Role, TeamUser } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { schoolFactory } from './school.factory';
import { userFactory } from './user.factory';
import { roleFactory } from './role.factory';
import { BaseEntityTestFactory } from './base-entity-test.factory';

class TeamUserFactory extends BaseEntityTestFactory<TeamUser, TeamUser> {
	withRoleAndUserId(role: Role, userId: string): this {
		const school = schoolFactory.build();
		const params: DeepPartial<TeamUser> = {
			user: userFactory.buildWithId({ school, roles: [roleFactory.build({ roles: [role] })] }, userId),
			school,
			role,
		};
		return this.params(params);
	}
}

export const teamUserFactory = TeamUserFactory.define(TeamUser, () => {
	const role = roleFactory.buildWithId();
	const school = schoolFactory.buildWithId();
	const user = userFactory.buildWithId({ roles: [role] });

	return new TeamUser({
		user,
		school,
		role,
	});
});
