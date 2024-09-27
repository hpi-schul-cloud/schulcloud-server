import { SchoolNameRequiredLoggableException } from './school-name-required-loggable-exception';

describe(SchoolNameRequiredLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const fieldName = 'id_token';

			const exception = new SchoolNameRequiredLoggableException(fieldName);

			return { exception, fieldName };
		};

		it('should return a LogMessage', () => {
			const { exception, fieldName } = setup();

			const logMessage = exception.getLogMessage();

			expect(logMessage).toEqual({
				type: 'SCHOOL_NAME_REQUIRED',
				message: 'External school name is required',
				stack: exception.stack,
				data: {
					fieldName,
				},
			});
		});
	});
});
