import { faker } from '@faker-js/faker';
import { TspSyncedUsersLoggable } from './tsp-synced-users.loggable';

describe(TspSyncedUsersLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const syncedUsers = faker.number.int();

			const expected = {
				message: `Synced ${syncedUsers} users from TSP.`,
				data: {
					syncedUsers,
				},
			};

			return { syncedUsers, expected };
		};

		it('should return a log message', () => {
			const { syncedUsers, expected } = setup();

			const loggable = new TspSyncedUsersLoggable(syncedUsers);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
