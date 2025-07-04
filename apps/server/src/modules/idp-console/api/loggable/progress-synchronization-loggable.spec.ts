import { ProgressSynchronizationLoggable } from './progress-synchronization-loggable';
import { LogMessage } from '@core/logger';

describe(ProgressSynchronizationLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = (stats: Partial<ConstructorParameters<typeof ProgressSynchronizationLoggable>[0]> = {}) => {
			const defaultStats = {
				chunkIndex: 1,
				externalUserIdCount: 5,
				userWithOneExternalIdCount: 3,
				usersWithAccountAndSystem: 2,
			};
			const mergedStats = { ...defaultStats, ...stats };
			const loggable = new ProgressSynchronizationLoggable(mergedStats);
			const expectedMessage: LogMessage = {
				message: `chunk ${mergedStats.chunkIndex}: synchronization package ${
					mergedStats.externalUserIdCount ?? 0
				} external user ids / ${mergedStats.userWithOneExternalIdCount ?? 0} users found / ${
					mergedStats.usersWithAccountAndSystem ?? 0
				} with account and correct system`,
				data: mergedStats,
			};
			return { loggable, expectedMessage, mergedStats };
		};

		it('should return the correct log message with all stats provided', () => {
			const { loggable, expectedMessage } = setup();
			expect(loggable.getLogMessage()).toEqual(expectedMessage);
		});

		it('should default missing optional stats to 0 in the message', () => {
			const { loggable, expectedMessage } = setup({
				externalUserIdCount: undefined,
				userWithOneExternalIdCount: undefined,
				usersWithAccountAndSystem: undefined,
			});
			expect(loggable.getLogMessage()).toEqual(expectedMessage);
		});

		it('should handle chunkIndex = 0', () => {
			const { loggable, expectedMessage } = setup({ chunkIndex: 2 });
			expect(loggable.getLogMessage()).toEqual(expectedMessage);
		});

		it('should handle negative numbers', () => {
			const { loggable, expectedMessage } = setup({
				externalUserIdCount: 10,
				userWithOneExternalIdCount: 20,
				usersWithAccountAndSystem: 30,
			});
			expect(loggable.getLogMessage()).toEqual(expectedMessage);
		});
	});
});
