import { courseFactory } from '@testing/factory/course.factory';
import { setupEntities } from '@testing/setup-entities';
import { CourseMapper } from './course.mapper';
import { CreateCourseResponse } from '../controller/dto';

describe(CourseMapper.name, () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('mapToCreateCourseResponse', () => {
		const setup = () => {
			const course = courseFactory.build();

			return { course };
		};

		it('should return CreateCourseResponse', () => {
			const { course } = setup();

			const result = CourseMapper.mapToCreateCourseResponse(course);

			expect(result).toEqual(new CreateCourseResponse({ courseId: course.id }));
		});
	});
});
