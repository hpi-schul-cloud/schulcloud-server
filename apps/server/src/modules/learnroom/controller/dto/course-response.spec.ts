import { courseFactory, setupEntities } from '@shared/testing';
import { CourseResponse } from './course.response';

describe('CourseResponse', () => {
	beforeAll(async () => {
		await setupEntities();
	});
	const setup = () => {
		const course = courseFactory.buildWithId({ startDate: new Date(), untilDate: new Date() });
		return { course };
	};
	it('should create a CourseResponseDTO object', () => {
		const { course } = setup();
		const courseResponse = new CourseResponse(course);
		expect(courseResponse.id).toEqual(courseResponse.id);
		expect(courseResponse.title).toEqual(courseResponse.title);
		expect(courseResponse.startDate).toEqual(courseResponse.startDate);
		expect(courseResponse.untilDate).toEqual(courseResponse.untilDate);
		expect(courseResponse.students).toEqual(courseResponse.students);
	});
	it('properties schould be undefined if not set', () => {
		const { course } = setup();
		course.startDate = undefined;
		course.untilDate = undefined;
		const courseResponse = new CourseResponse(course);
		expect(courseResponse.startDate).toBeUndefined();
		expect(courseResponse.untilDate).toBeUndefined();
	});
});
