import {ITeamProperties, RoleName, Team} from '@shared/domain';
import {BaseFactory} from './base.factory';
import {roleFactory, schoolFactory, userFactory} from "@shared/testing";
import {DeepPartial} from "fishery";

class TeamFactory extends BaseFactory<Team, ITeamProperties> {
	withRoleAndUserId(name: RoleName, userId: string): this {
		const school = schoolFactory.build()
		const params: DeepPartial<ITeamProperties> = {
			userIds:[{
				userId: userFactory.buildWithId({ school, roles: [roleFactory.build({name: name})] }, userId),
				schoolId: school,
				role: roleFactory.build({name: name})}]} ;
		return this.params(params);
	}
}

export const teamFactory = TeamFactory.define(Team, ({ sequence }) => {
	const role = roleFactory.build();
	const school = schoolFactory.build();
	const userId = userFactory.withRole(RoleName.DEMO).buildWithId({ roles: [role] });
	return {
		name: `team #${sequence}`,
		userIds: [{
			userId: userId,
			schoolId: school,
			role: role,
		}]
	};
});
