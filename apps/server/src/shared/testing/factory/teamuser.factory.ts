import { Role, TeamUser } from '@shared/domain';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { roleFactory } from '@shared/testing/factory/role.factory';

class TeamUserFactory extends BaseFactory<TeamUser, TeamUser> {
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
	return {
		user: userFactory.buildWithId(),
		school: schoolFactory.buildWithId(),
		role: roleFactory.buildWithId(),
	};
});
