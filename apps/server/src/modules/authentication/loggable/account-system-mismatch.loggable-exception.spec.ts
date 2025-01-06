import { ObjectId } from '@mikro-orm/mongodb';
import { AccountSystemMismatchLoggableException } from './account-system-mismatch.loggable-exception';

describe(AccountSystemMismatchLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const expected = new ObjectId().toHexString();
			const received = new ObjectId().toHexString();

			const exception = new AccountSystemMismatchLoggableException(expected, received);

			return {
				exception,
				expected,
				received,
			};
		};

		it('should return the correct log message', () => {
			const { exception, expected, received } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'LOGIN_SYSTEM_MISMATCH',
				stack: expect.any(String),
				data: {
					expected,
					received,
				},
			});
		});
	});
});
