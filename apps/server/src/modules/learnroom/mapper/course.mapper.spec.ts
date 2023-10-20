import { courseFactory, setupEntities } from '@shared/testing';
import { CourseResponse } from '../controller/dto';
import { CourseMapper } from './course.mapper';

describe('course mapper', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('mapToCourseResponse', () => {
		it('should map task-card to response', () => {
			const course = courseFactory.buildWithId();

			const result: CourseResponse = CourseMapper.mapToCourseResponse(course);

			expect(result).toEqual({
				id: course.id,
				title: course.name,
				startDate: course.startDate,
				untilDate: course.untilDate,
				students: course.getStudentsList(),
			});
		});
		it('date fields should be undefined', () => {
			const course = courseFactory.buildWithId({
				startDate: undefined,
				untilDate: undefined,
			});

			const result: CourseResponse = CourseMapper.mapToCourseResponse(course);

			expect(result.startDate).toBeUndefined();
			expect(result.untilDate).toBeUndefined();
		});
	});
});
