import { SchoolErrorEnum } from './error.enum';
import { SchoolHasNoSystemLoggableException } from './school-has-no-system.loggable-exception';

describe('SchoolHasNoSystemLoggableException', () => {
	describe('getLogMessage', () => {
		it('should return log message', () => {
			const exception = new SchoolHasNoSystemLoggableException('schoolId', 'systemId');

			const result = exception.getLogMessage();

			expect(result).toStrictEqual({
				type: SchoolErrorEnum.SCHOOL_HAS_NO_SYSTEM,
				stack: exception.stack,
				data: {
					schoolId: 'schoolId',
					systemId: 'systemId',
				},
			});
		});
	});
});
