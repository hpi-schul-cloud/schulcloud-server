import { Role, TeamUserEntity } from '@shared/domain';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { schoolFactory } from '@shared/testing/factory/school.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { roleFactory } from '@shared/testing/factory/role.factory';

class TeamUserFactory extends BaseFactory<TeamUserEntity, TeamUserEntity> {
	withRoleAndUserId(role: Role, userId: string): this {
		const school = schoolFactory.build();
		const params: DeepPartial<TeamUserEntity> = {
			user: userFactory.buildWithId({ school, roles: [roleFactory.build({ roles: [role] })] }, userId),
			school,
			role,
		};
		return this.params(params);
	}

	withUserId(userId: string): this {
		const school = schoolFactory.build();
		const params: DeepPartial<TeamUserEntity> = {
			user: userFactory.buildWithId({ school }, userId),
			school,
		};
		return this.params(params);
	}
}

export const teamUserFactory = TeamUserFactory.define(TeamUserEntity, () => {
	const role = roleFactory.buildWithId();
	const school = schoolFactory.buildWithId();
	const user = userFactory.buildWithId({ roles: [role] });

	return new TeamUserEntity({
		user,
		school,
		role,
	});
});
