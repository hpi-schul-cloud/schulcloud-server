import { ObjectId } from '@mikro-orm/mongodb';
import { IdenticalUserLoginMigrationSystemLoggableException } from './identical-user-login-migration-system.loggable-exception';

describe(IdenticalUserLoginMigrationSystemLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const schoolId = new ObjectId().toHexString();
			const targetSystemId = new ObjectId().toHexString();

			const exception: IdenticalUserLoginMigrationSystemLoggableException =
				new IdenticalUserLoginMigrationSystemLoggableException(schoolId, targetSystemId);

			return {
				schoolId,
				targetSystemId,
				exception,
			};
		};

		it('should return log message', () => {
			const { exception, schoolId, targetSystemId } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'IDENTICAL_USER_LOGIN_MIGRATION_SYSTEM',
				message:
					'The migration cannot be started, because the target system and current schools login system are the same.',
				stack: exception.stack,
				data: {
					schoolId,
					targetSystemId,
				},
			});
		});
	});
});
