import { externalGroupDtoFactory, externalGroupUserDtoFactory } from '../testing';
import { GroupProvisioningInfoLoggable } from './group-provisioning-info.loggable';

describe(GroupProvisioningInfoLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const groupCount = 2;
			const otherUserCount = 5;
			const totalUserCount = groupCount * otherUserCount + groupCount;
			const externalGroups = externalGroupDtoFactory.buildList(groupCount, {
				otherUsers: externalGroupUserDtoFactory.buildList(otherUserCount),
			});

			const loggable = new GroupProvisioningInfoLoggable(externalGroups, 100, 'igorHatGesagt');

			return {
				loggable,
				totalUserCount,
				groupCount,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, totalUserCount, groupCount } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Group provisioning has finished.',
				data: {
					groupCount,
					userCount: totalUserCount,
					durationMs: 100,
					externalUserId: 'igorHatGesagt',
				},
			});
		});
	});
});
