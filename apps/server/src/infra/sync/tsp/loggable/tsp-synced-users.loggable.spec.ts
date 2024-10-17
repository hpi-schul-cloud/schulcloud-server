import { TspSyncedUsersLoggable } from './tsp-synced-users.loggable';

describe(TspSyncedUsersLoggable.name, () => {
	let loggable: TspSyncedUsersLoggable;

	beforeAll(() => {
		loggable = new TspSyncedUsersLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Synced 10 users from TSP.`,
				data: {
					syncedUsers: 10,
				},
			});
		});
	});
});
