import { courseFactory } from '../../testing';
import { CourseAlreadySynchronizedLoggableException } from './course-already-synchronized.loggable-exception';

describe(CourseAlreadySynchronizedLoggableException.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const course = courseFactory.build();

			const exception = new CourseAlreadySynchronizedLoggableException(course.id);

			return {
				exception,
				course,
			};
		};

		it('should log the correct message', () => {
			const { exception, course } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'COURSE_ALREADY_SYNCHRONIZED',
				stack: expect.any(String),
				data: {
					courseId: course.id,
				},
			});
		});
	});
});
