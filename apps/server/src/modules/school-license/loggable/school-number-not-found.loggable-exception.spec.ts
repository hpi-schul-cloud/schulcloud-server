import { SchoolNumberNotFoundLoggableException } from './school-number-not-found.loggable-exception';

describe(SchoolNumberNotFoundLoggableException.name, () => {
	const setup = () => {
		const schoolId = 'testSchoolId';
		const exception = new SchoolNumberNotFoundLoggableException(schoolId);

		return {
			exception,
			schoolId,
		};
	};

	it('should return the correct log message', () => {
		const { exception, schoolId } = setup();

		const logMessage = exception.getLogMessage();

		expect(logMessage).toEqual({
			message: 'Required school number for media school licenses request is missing.',
			data: {
				schoolId,
			},
		});
	});
});
