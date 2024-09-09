import { UserMigrationCorrectionSuccessfulLoggable } from '@modules/user-login-migration/loggable/debug/user-migration-correction-successful-loggable';
import { userLoginMigrationDOFactory } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserLoginMigrationDO } from '@shared/domain/domainobject';
import { LogMessage } from '@src/core/logger';

describe(UserMigrationCorrectionSuccessfulLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const userId: string = new ObjectId().toHexString();
			const userLoginMigration: UserLoginMigrationDO = userLoginMigrationDOFactory.buildWithId();

			const loggable = new UserMigrationCorrectionSuccessfulLoggable(userId, userLoginMigration);

			return {
				userId,
				userLoginMigration,
				loggable,
			};
		};

		it('should return the correct log message', () => {
			const { userId, userLoginMigration, loggable } = setup();

			const message: LogMessage = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'A user has been successfully corrected.',
				data: {
					userId,
					userLoginMigrationId: userLoginMigration.id,
				},
			});
		});
	});
});
