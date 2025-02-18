import { ObjectId } from '@mikro-orm/mongodb';
import { GroupProvisioningSuccessfulLoggable } from './group-provisioning-successful.loggable';

describe(GroupProvisioningSuccessfulLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const groupId = new ObjectId().toHexString();
			const systemId = new ObjectId().toHexString();
			const externalGroupId = new ObjectId().toHexString();

			const loggable = new GroupProvisioningSuccessfulLoggable(groupId, externalGroupId, systemId);

			return {
				loggable,
				groupId,
				systemId,
				externalGroupId,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, groupId, systemId, externalGroupId } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Group provisioning successful',
				data: {
					groupId,
					systemId,
					externalGroupId,
				},
			});
		});
	});
});
