import { NotFoundException } from '@nestjs/common';
import { importUserFactory } from '@testing/factory/import-user.factory';
import { setupEntities } from '@testing/setup-entities';
import { UserMigrationFailedLoggable } from './user-migration-failed.loggable';

describe(UserMigrationFailedLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = async () => {
			await setupEntities();
			const importUser = importUserFactory.build();
			const error = new NotFoundException('user not found');
			const loggable = new UserMigrationFailedLoggable(importUser, error);

			return {
				loggable,
				importUser,
				error,
			};
		};

		it('should return the correct log message', async () => {
			const { loggable, importUser, error } = await setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				type: 'USER_MIGRATION_FAILED',
				message: 'An error occurred while migrating a user with the migration wizard.',
				stack: error.stack,
				data: {
					externalUserId: importUser.externalId,
					userId: importUser.user?.id,
					errorName: error.name,
					errorMsg: error.message,
				},
			});
		});
	});
});
