import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { TeamUserEntity } from '../repo';
import { TeamUserProperties } from '../repo/team.entity';

class TeamUserFactory extends BaseFactory<TeamUserEntity, TeamUserProperties> {
	public withRoleAndUserId(role: Role, userId: string): this {
		const school = schoolEntityFactory.build();
		const params: DeepPartial<TeamUserProperties> = {
			user: userFactory.buildWithId({ school, roles: [roleFactory.build({ roles: [role] })] }, userId),
			school,
			role,
		};
		return this.params(params);
	}

	public withUserId(userId: string): this {
		const school = schoolEntityFactory.build();
		const params: DeepPartial<TeamUserProperties> = {
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

	return {
		user,
		school,
		role,
	};
});
