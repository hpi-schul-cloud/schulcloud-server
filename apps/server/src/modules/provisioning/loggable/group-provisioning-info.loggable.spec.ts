import { externalGroupDtoFactory, externalGroupUserDtoFactory, externalUserDtoFactory } from '../testing';
import { GroupProvisioningInfoLoggable } from './group-provisioning-info.loggable';

describe(GroupProvisioningInfoLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const groupCount = 2;
			const otherUserCount = 5;
			const totalUserCount = groupCount * otherUserCount + groupCount;
			const externalUser = externalUserDtoFactory.build();
			const externalGroups = externalGroupDtoFactory.buildList(groupCount, {
				otherUsers: externalGroupUserDtoFactory.buildList(otherUserCount),
			});

			const loggable = new GroupProvisioningInfoLoggable(externalUser, externalGroups, 100);

			return {
				loggable,
				externalUser,
				totalUserCount,
				groupCount,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, externalUser, totalUserCount, groupCount } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Group provisioning has finished.',
				data: {
					externalUserId: externalUser.externalId,
					groupCount,
					userCount: totalUserCount,
					durationMs: 100,
				},
			});
		});
	});
});
