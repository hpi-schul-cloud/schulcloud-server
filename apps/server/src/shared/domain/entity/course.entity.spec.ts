import { MikroORM } from '@mikro-orm/core';
import { InternalServerErrorException } from '@nestjs/common';
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
			const startDate = new Date(Date.now() - 200000);
			const untilDate = new Date(Date.now() + 200000);
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

	describe('getStudentIds is called', () => {
		describe('when students exist', () => {
			const setup = () => {
				const student1 = userFactory.buildWithId();
				const student2 = userFactory.buildWithId();
				const student3 = userFactory.buildWithId();
				const students = [student1, student2, student3];
				const studentIds = [student1.id, student2.id, student3.id];

				const course = courseFactory.build({ students });

				return { course, studentIds };
			};

			it('should be return the userIds of the students.', () => {
				const { course, studentIds } = setup();

				const result = course.getStudentIds();

				expect(result.length).toEqual(3);
				expect(result).toContain(studentIds[0]);
				expect(result).toContain(studentIds[1]);
				expect(result).toContain(studentIds[2]);
			});
		});

		describe('when course is not populated', () => {
			const setup = () => {
				const course = courseFactory.build();
				Object.assign(course, { students: undefined });

				return { course };
			};

			it('should throw with internal server exception.', () => {
				const { course } = setup();

				expect(() => {
					course.getStudentIds();
				}).toThrowError(InternalServerErrorException);
			});
		});
	});

	describe('getStudentList', () => {
		const setup = () => {
			const students = userFactory.buildList(3);
			const course = courseFactory.build({ students });
			return { course, students };
		};
		it('should return the students of the course', () => {
			const { course, students } = setup();

			const result = course.getStudentsList();

			expect(result.length).toEqual(3);
			expect(result[0]).toEqual(students[0]);
		});
	});

	describe('isUserSubstitutionTeacher is called', () => {
		describe('when user is a subsitution teacher', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ substitutionTeachers: [user] });

				return { course, user };
			};

			it('should return true.', () => {
				const { course, user } = setup();

				const result = course.isUserSubstitutionTeacher(user);

				expect(result).toBe(true);
			});
		});

		describe('when user is a not subsitution teacher.', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.build({ substitutionTeachers: [] });

				return { course, user };
			};

			it('should return false.', () => {
				const { course, user } = setup();

				const result = course.isUserSubstitutionTeacher(user);

				expect(result).toBe(false);
			});
		});
	});
});
