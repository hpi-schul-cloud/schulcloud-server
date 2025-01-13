import { faker } from '@faker-js/faker';
import { TspSyncingUsersLoggable } from './tsp-syncing-users.loggable';

describe(TspSyncingUsersLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const syncingUsers = faker.number.int();

			const expected = {
				message: `Syncing ${syncingUsers} users from TSP.`,
				data: {
					syncingUsers,
				},
			};

			return { syncingUsers, expected };
		};

		it('should return a log message', () => {
			const { syncingUsers, expected } = setup();

			const loggable = new TspSyncingUsersLoggable(syncingUsers);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
