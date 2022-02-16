import { userFactory, courseFactory, schoolFactory, setupEntities } from '@shared/testing';
import { Course } from './course.entity';

const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
};

describe('CourseEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Course();
			expect(test).toThrow();
		});

		it('should create a course by passing required properties', () => {
			const course = courseFactory.build();
			expect(course instanceof Course).toEqual(true);
		});
	});

	describe('defaults', () => {
		it('should return defaults values', () => {
			const school = schoolFactory.build();
			const course = new Course({ school });

			expect(course.name).toEqual(DEFAULT.name);
			expect(course.description).toEqual(DEFAULT.description);
			expect(course.color).toEqual(DEFAULT.color);
		});
	});

	describe('getMetadata', () => {
		it('should return a metadata object', () => {
			const course = courseFactory.build({ name: 'History', color: '#445566' });

			const result = course.getMetadata();

			expect(result.title).toEqual('History');
			expect(result.shortTitle).toEqual('Hi');
			expect(result.displayColor).toEqual('#445566');
			expect(result.id).toEqual(course.id);
		});

		it('should include start and enddate if course has them', () => {
			const startDate = Date.now() - 200000;
			const untilDate = Date.now() + 200000;
			const course = courseFactory.build({
				name: 'History',
				color: '#445566',
				startDate,
				untilDate,
			});

			const result = course.getMetadata();

			expect(result.title).toEqual('History');
			expect(result.shortTitle).toEqual('Hi');
			expect(result.displayColor).toEqual('#445566');
			expect(result.id).toEqual(course.id);
			expect(result.startDate).toEqual(startDate);
			expect(result.untilDate).toEqual(untilDate);
		});
	});

	describe('getStudents', () => {
		it('should count the number of assigned students', () => {
			const student1 = userFactory.build();
			const student2 = userFactory.build();
			const course = courseFactory.build({ students: [student1, student2] });

			const number = course.getNumberOfStudents();

			expect(number).toEqual(2);
		});

		it('should return 0 if no student is assigned', () => {
			const teacher = userFactory.build();
			const course = courseFactory.build({ teachers: [teacher], students: [] });

			const number = course.getNumberOfStudents();

			expect(number).toEqual(0);
		});
	});

	describe('isFinished', () => {
		it('should always return false if no untilDate is set', () => {
			const course = courseFactory.build({ untilDate: undefined });

			const result = course.isFinished();

			expect(result).toBe(false);
		});

		it('should return false if the course is not finished', () => {
			const untilDate = new Date(Date.now() + 6000);
			const course = courseFactory.build({ untilDate });

			const result = course.isFinished();

			expect(result).toBe(false);
		});

		it('should return false if the course is not finished', () => {
			const untilDate = new Date(Date.now() - 6000);
			const course = courseFactory.build({ untilDate });

			const result = course.isFinished();

			expect(result).toBe(true);
		});
	});
});
