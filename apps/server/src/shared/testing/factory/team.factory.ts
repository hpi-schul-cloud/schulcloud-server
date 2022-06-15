import {ITeamProperties, RoleName, Team} from '@shared/domain';
import {BaseFactory} from './base.factory';
import {roleFactory, schoolFactory, userFactory} from "@shared/testing";

export const teamFactory = BaseFactory.define<Team, ITeamProperties>(Team, ({ sequence }) => {
	return {
		name: `team #${sequence}`,
		userIds: [{
			userId: userFactory.withRole(RoleName.USER).build(),
			role: roleFactory.build(),
			schoolId: schoolFactory.build()
		}]
	};
});
