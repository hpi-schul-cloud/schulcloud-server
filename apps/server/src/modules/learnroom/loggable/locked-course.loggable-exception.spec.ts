import { LockedCourseLoggableException } from './locked-course.loggable-exception';
import { ForbiddenException } from '@nestjs/common';

describe('LockedCourseLoggableException', () => {
	const message = 'Course is locked';
	const id = 'course-123';

	it('should extend ForbiddenException', () => {
		const exception = new LockedCourseLoggableException(message, id);
		expect(exception).toBeInstanceOf(ForbiddenException);
	});

	it('should return correct log message', () => {
		const exception = new LockedCourseLoggableException(message, id);
		const log = exception.getLogMessage();
		expect(log).toMatchObject({
			type: 'LOCKED_COURSE',
			message,
			data: { id },
		});
		expect(log.stack).toBeDefined();
	});

	it('should handle undefined id in log message', () => {
		const exception = new LockedCourseLoggableException(message);
		const log = exception.getLogMessage();
		expect(log.data).toEqual({ id: undefined });
	});
});
