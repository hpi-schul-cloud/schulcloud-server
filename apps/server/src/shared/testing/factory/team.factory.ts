import {ITeamProperties, RoleName, Team} from '@shared/domain';
import {BaseFactory} from './base.factory';
import {roleFactory, schoolFactory, userFactory} from "@shared/testing";

export const teamFactory = BaseFactory.define<Team, ITeamProperties>(Team, ({ sequence }) => {
	const role = roleFactory.build();
	const school = schoolFactory.build();
	const userId = userFactory.withRole(RoleName.DEMO).build({ school });
	return {
		name: `team #${sequence}`,
		userIds: []
	};
});
