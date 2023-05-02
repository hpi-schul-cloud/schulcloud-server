import { courseFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { CourseMapper } from './course.mapper';

describe('course-mapper', () => {
	beforeAll(async () => {
		await setupEntities();
	});
});

describe('mapToCourseResponse', () => {
	const setup = () => {
		const course = courseFactory.buildWithId({
			name: 'test',
			description: 'some description',
			school: schoolFactory.buildWithId(),
			students: userFactory.buildListWithId(2),
			teachers: userFactory.buildListWithId(2),
			substitutionTeachers: userFactory.buildListWithId(2),
			color: '#000000',
			startDate: new Date(),
			untilDate: new Date(Date.now() + 86400000),
			copyingSince: new Date(Date.now() - 172800000),
		});
		return { course };
	};
	it('should map course to response', () => {
		const { course } = setup();
		const result = CourseMapper.mapToCourseResponse(course);

		expect(result).toEqual({
			id: course.id,
			description: course.description,
			school: course.school,
			students: course.students,
			teachers: course.teachers,
			substitutionTeachers: course.substitutionTeachers,
			color: course.color,
			startDate: course.startDate,
			untilDate: course.untilDate,
			copyingSince: course.copyingSince,
		});
	});
});
