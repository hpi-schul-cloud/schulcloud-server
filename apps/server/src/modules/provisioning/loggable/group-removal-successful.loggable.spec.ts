import { ObjectId } from '@mikro-orm/mongodb';
import { GroupRemovalSuccessfulLoggable } from './group-removal-successful.loggable';

describe(GroupRemovalSuccessfulLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const groupId = new ObjectId().toHexString();
			const userId = new ObjectId().toHexString();
			const groupDeleted = true;

			const loggable = new GroupRemovalSuccessfulLoggable(groupId, userId, groupDeleted);

			return {
				loggable,
				groupId,
				userId,
				groupDeleted,
			};
		};

		it('should return a loggable message', () => {
			const { loggable, groupId, userId, groupDeleted } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'Group removal successful',
				data: {
					groupId,
					userId,
					groupDeleted,
				},
			});
		});
	});
});
