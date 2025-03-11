import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolNumberMissingLoggableException } from './school-number-missing.loggable-exception';

describe(SchoolNumberMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const schoolId = new ObjectId().toHexString();

			const exception = new SchoolNumberMissingLoggableException(schoolId);

			return {
				exception,
				schoolId,
			};
		};

		it('should return the correct log message', () => {
			const { exception, schoolId } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				type: 'SCHOOL_NUMBER_MISSING',
				message: 'The school is missing a official school number.',
				stack: expect.any(String),
				data: {
					schoolId,
				},
			});
		});
	});
});
