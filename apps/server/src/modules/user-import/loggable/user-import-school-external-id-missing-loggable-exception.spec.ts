import { ObjectId } from 'mongodb';
import { UserImportSchoolExternalIdMissingLoggableException } from './user-import-school-external-id-missing-loggable-exception';

describe(UserImportSchoolExternalIdMissingLoggableException.name, () => {
	describe('getLoggableMessage', () => {
		const setup = () => {
			const userId: string = new ObjectId().toHexString();
			const exception = new UserImportSchoolExternalIdMissingLoggableException(userId);

			return { exception, userId };
		};

		it('should return the correct message', () => {
			const { exception, userId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'USER_IMPORT_SCHOOL_EXTERNAL_ID_MISSING',
				message: 'The users school does not have an external id',
				stack: exception.stack,
				data: {
					userId,
				},
			});
		});
	});
});
