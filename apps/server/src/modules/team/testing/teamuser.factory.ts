import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { TeamUserEntity } from '../repo';

class TeamUserFactory extends BaseFactory<TeamUserEntity, TeamUserEntity> {
	withRoleAndUserId(role: Role, userId: string): this {
		const school = schoolEntityFactory.build();
		const params: DeepPartial<TeamUserEntity> = {
			user: userFactory.buildWithId({ school, roles: [roleFactory.build({ roles: [role] })] }, userId),
			school,
			role,
		};
		return this.params(params);
	}

	withUserId(userId: string): this {
		const school = schoolEntityFactory.build();
		const params: DeepPartial<TeamUserEntity> = {
			user: userFactory.buildWithId({ school }, userId),
			school,
		};
		return this.params(params);
	}
}

export const teamUserFactory = TeamUserFactory.define(TeamUserEntity, () => {
	const role = roleFactory.buildWithId();
	const school = schoolEntityFactory.buildWithId();
	const user = userFactory.buildWithId({ roles: [role] });

	return new TeamUserEntity({
		user,
		school,
		role,
	});
});
