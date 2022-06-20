import { ITeamProperties, RoleName, Team } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { roleFactory, userFactory } from '@shared/testing';
import { BaseFactory } from './base.factory';
import { schoolFactory } from './school.factory';

class TeamFactory extends BaseFactory<Team, ITeamProperties> {
	withRoleAndUserId(name: RoleName, userId: string): this {
		const school = schoolFactory.build();
		const params: DeepPartial<ITeamProperties> = {
			userIds: [
				{
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call
					userId: userFactory.buildWithId({ school, roles: [roleFactory.build({ name })] }, userId),
					schoolId: school,
					role: roleFactory.build({ name }),
				},
			],
		};
		return this.params(params);
	}
}

export const teamFactory = TeamFactory.define(Team, ({ sequence }) => {
	const role = roleFactory.build();
	const schoolId = schoolFactory.build();
	const userId = userFactory.withRole(RoleName.DEMO).buildWithId({ roles: [role] });
	return {
		name: `team #${sequence}`,
		userIds: [
			{
				userId,
				schoolId,
				role,
			},
		],
	};
});
