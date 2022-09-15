import { MikroORM } from '@mikro-orm/core';
import { courseFactory, courseGroupFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { ObjectId } from 'bson';
import { Course } from './course.entity';
import { CourseGroup } from './coursegroup.entity';

const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
};

describe('CourseEntity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
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

		it('should return only emoji as shortTitle if used as first character', () => {
			const course = courseFactory.build({ name: '😀 History', color: '#445566' });

			const result = course.getMetadata();

			expect(result.title).toEqual('😀 History');
			expect(result.shortTitle).toEqual('😀');
		});

		it('should return emoji correctly in shortTitle if used as second character', () => {
			const course = courseFactory.build({ name: 'A😀 History', color: '#445566' });

			const result = course.getMetadata();

			expect(result.title).toEqual('A😀 History');
			expect(result.shortTitle).toEqual('A😀');
		});

		it('should return numbers correctly as shortTitle if used as first two characters', () => {
			const course = courseFactory.build({ name: '10 History', color: '#445566' });

			const result = course.getMetadata();

			expect(result.title).toEqual('10 History');
			expect(result.shortTitle).toEqual('10');
		});

		it('should return correct shortTitle if course name only consists of one letter', () => {
			const course = courseFactory.build({ name: 'A' });

			const result = course.getMetadata();

			expect(result.title).toEqual('A');
			expect(result.shortTitle).toEqual('A');
		});

		it('should return correct shortTitle if course name only consists of one number', () => {
			const course = courseFactory.build({ name: '1' });

			const result = course.getMetadata();

			expect(result.title).toEqual('1');
			expect(result.shortTitle).toEqual('1');
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

	describe('getNumberOfStudents', () => {
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

		it('should return 0 if student not an array', () => {
			const teacher = userFactory.build();
			const course = courseFactory.build({ teachers: [teacher], students: undefined });

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

	describe('getCourseGroupItems', () => {
		describe('when course groups are not populated', () => {
			it('should throw', () => {
				const course = courseFactory.build();
				course.courseGroups.set([orm.em.getReference(CourseGroup, new ObjectId().toHexString())]);

				expect(() => course.getCourseGroupItems()).toThrow();
			});
		});

		describe('when course groups are populated', () => {
			it('should return the linked course groups to that course', () => {
				const course = courseFactory.build();
				const courseGroups = courseGroupFactory.buildList(2, { course });

				const result = course.getCourseGroupItems();
				expect(result.length).toEqual(2);
				expect(result[0]).toEqual(courseGroups[0]);
			});
		});
	});
});
