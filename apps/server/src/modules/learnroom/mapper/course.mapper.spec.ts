import { Course, CourseGroup } from '@shared/domain/entity';
import { setupEntities } from '@testing/database';
import { courseFactory } from '@testing/factory/course.factory';
import { CreateCourseResponse } from '../controller/dto';
import { CourseMapper } from './course.mapper';

describe(CourseMapper.name, () => {
	beforeAll(async () => {
		await setupEntities([Course, CourseGroup]);
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
