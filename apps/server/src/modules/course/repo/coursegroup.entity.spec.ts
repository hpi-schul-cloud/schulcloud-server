import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { setupEntities } from '@testing/database';
import { courseEntityFactory, courseGroupEntityFactory } from '../testing';
import { CourseEntity } from './course.entity';
import { CourseGroupEntity } from './coursegroup.entity';

describe('CourseGroupEntity', () => {
	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);
	});

	describe('constructor', () => {
		it('should throw an error if constructor is called without arguments', () => {
			// @ts-expect-error: Test case
			const test = () => new CourseGroupEntity();

			expect(test).toThrow();
		});

		it('should create a courseGroup when passing required properties', () => {
			const name = 'someName';
			const course = courseEntityFactory.build();

			const courseGroup = new CourseGroupEntity({ name, course });

			expect(courseGroup instanceof CourseGroupEntity).toEqual(true);
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

				const courseGroup = courseGroupEntityFactory.build({ students });

				return { courseGroup, studentIds };
			};

			it('should return the userIds of the students', () => {
				const { courseGroup, studentIds } = setup();

				const result = courseGroup.getStudentIds();

				expect(result.length).toEqual(3);
				expect(result).toContain(studentIds[0]);
				expect(result).toContain(studentIds[1]);
				expect(result).toContain(studentIds[2]);
			});
		});

		describe('when course group is not populated', () => {
			const setup = () => {
				const courseGroup = courseGroupEntityFactory.build();
				Object.assign(courseGroup, { students: undefined });

				return { courseGroup };
			};

			it('should return empty array', () => {
				const { courseGroup } = setup();

				const result = courseGroup.getStudentIds();
				expect(result).toEqual([]);
			});
		});
	});

	describe('removeStudent is called', () => {
		describe('when students exist', () => {
			const setup = () => {
				const student1 = userFactory.buildWithId();
				const student2 = userFactory.buildWithId();
				const students = [student1, student2];
				const studentIds = [student1.id, student2.id];

				const courseGroup = courseGroupEntityFactory.build({ students });

				return { courseGroup, student1, studentIds };
			};

			it('should be delete the userId from the students list.', () => {
				const { courseGroup, student1, studentIds } = setup();

				courseGroup.removeStudent(student1.id);

				const result = courseGroup.getStudentIds();

				expect(result.length).toEqual(1);
				expect(result).toContain(studentIds[1]);
			});
		});
	});
});
