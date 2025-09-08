import { courseFactory } from '../../testing';
import { CourseNotSynchronizedLoggableException } from './course-not-synchronized.loggable-exception';

describe(CourseNotSynchronizedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const course = courseFactory.build();

			const exception = new CourseNotSynchronizedLoggableException(course.id);

			return {
				exception,
				course,
			};
		};

		it('should log the correct message', () => {
			const { exception, course } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'COURSE_NOT_SYNCHRONIZED',
				stack: expect.any(String),
				data: {
					courseId: course.id,
				},
			});
		});
	});
});
