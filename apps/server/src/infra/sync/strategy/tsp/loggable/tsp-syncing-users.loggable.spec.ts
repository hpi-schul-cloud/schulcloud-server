import { TspSyncingUsersLoggable } from './tsp-syncing-users.loggable';

describe(TspSyncingUsersLoggable.name, () => {
	let loggable: TspSyncingUsersLoggable;

	beforeAll(() => {
		loggable = new TspSyncingUsersLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Syncing 10 users from TSP.`,
				data: {
					syncingUsers: 10,
				},
			});
		});
	});
});
