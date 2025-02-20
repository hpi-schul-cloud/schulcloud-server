import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { setupEntities } from '@testing/database';
import { CreateCourseResponse } from '../controller/dto';
import { CourseMapper } from './course.mapper';

describe(CourseMapper.name, () => {
	beforeAll(async () => {
		await setupEntities([CourseEntity, CourseGroupEntity]);
	});

	describe('mapToCreateCourseResponse', () => {
		const setup = () => {
			const course = courseEntityFactory.build();

			return { course };
		};

		it('should return CreateCourseResponse', () => {
			const { course } = setup();

			const result = CourseMapper.mapToCreateCourseResponse(course);

			expect(result).toEqual(new CreateCourseResponse({ courseId: course.id }));
		});
	});
});
