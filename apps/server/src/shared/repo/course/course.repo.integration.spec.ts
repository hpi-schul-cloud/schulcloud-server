import { MongoMemoryDatabaseModule } from '@infra/database';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Course } from '@shared/domain/entity';
import { SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { cleanupCollections, courseFactory, courseGroupFactory, userFactory } from '@shared/testing';
import { CourseRepo } from './course.repo';

const checkEqualIds = (arr1: { id: EntityId }[], arr2: { id: EntityId }[]): boolean => {
	const ids2 = arr2.map((o) => o.id);
	const isEqual = arr1.every((o) => ids2.includes(o.id));
	return isEqual;
};

describe('course repo', () => {
	let module: TestingModule;
	let repo: CourseRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [CourseRepo],
		}).compile();
		repo = module.get(CourseRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findAllByUserId).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Course);
	});

	describe('findAllByUserId', () => {
		it('should return right keys', async () => {
			const student = userFactory.build();
			const course = courseFactory.build({ students: [student] });

			await em.persistAndFlush(course);
			em.clear();

			const [result] = await repo.findAllByUserId(student.id);

			const keysOfFirstElements = Object.keys(result[0]).sort();
			const expectedResult = [
				'_id',
				'color',
				'createdAt',
				'copyingSince',
				'courseGroups',
				'description',
				'name',
				'school',
				'shareToken',
				'startDate',
				'substitutionTeachers',
				'teachers',
				'untilDate',
				'updatedAt',
				'students',
				'features',
				'classes',
				'groups',
				'syncedWithGroup',
			].sort();
			expect(keysOfFirstElements).toEqual(expectedResult);
		});

		it('should return nothing by undefined value for user', async () => {
			// @ts-expect-error test-case
			const result = await repo.findAllByUserId(undefined);

			const expectedResult = [[], 0];
			expect(result).toEqual(expectedResult);
		});

		it('should return nothing by null value for user', async () => {
			// @ts-expect-error test-case
			const result = await repo.findAllByUserId(null);

			const expectedResult = [[], 0];
			expect(result).toEqual(expectedResult);
		});

		it('should return course of teachers', async () => {
			const teacher = userFactory.build();
			await em.persistAndFlush(teacher);
			const course1 = courseFactory.build({ name: 'course #1', teachers: [teacher] });
			const course2 = courseFactory.build({ name: 'course #2', teachers: [teacher] });

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(teacher.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should return course of students', async () => {
			const student = userFactory.build();
			const course1 = courseFactory.build({ name: 'course #1', students: [student] });
			const course2 = courseFactory.build({ name: 'course #2', students: [student] });

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should return course of substitution teachers', async () => {
			const subTeacher = userFactory.build();
			await em.persistAndFlush(subTeacher);
			const course1 = courseFactory.build({ name: 'course #1', substitutionTeachers: [subTeacher] });
			const course2 = courseFactory.build({ name: 'course #2', substitutionTeachers: [subTeacher] });

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(subTeacher.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should handle mixed roles in courses', async () => {
			const user = userFactory.build();
			await em.persistAndFlush(user);
			const course1 = courseFactory.build({ name: 'course #1', students: [user] });
			const course2 = courseFactory.build({ name: 'course #2', teachers: [user] });
			const course3 = courseFactory.build({ name: 'course #3', substitutionTeachers: [user] });

			await em.persistAndFlush([course1, course2, course3]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(user.id);

			expect(checkEqualIds(result, [course1, course2, course3])).toEqual(true);
			expect(count).toEqual(3);
		});

		it('should only return courses when the user is a member of it', async () => {
			const user = userFactory.build();
			const otherUser = userFactory.build();
			await em.persistAndFlush([user, otherUser]);
			const courses = [
				courseFactory.build({ name: 'course #1', students: [user] }),
				courseFactory.build({ name: 'course #2', substitutionTeachers: [user] }),
				courseFactory.build({ name: 'course #3', teachers: [user] }),
			];
			const otherCourses = [
				courseFactory.build({ name: 'course #1', students: [otherUser] }),
				courseFactory.build({ name: 'course #2', substitutionTeachers: [otherUser] }),
				courseFactory.build({ name: 'course #3', teachers: [otherUser] }),
			];

			await em.persistAndFlush([...courses, ...otherCourses]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(user.id);

			expect(checkEqualIds(result, courses)).toEqual(true);
			expect(count).toEqual(3);
		});

		it('should only return courses that are currently active', async () => {
			const student = userFactory.build();
			const twoDaysInMilliSeconds = 172800000;
			const course1 = courseFactory.build({
				name: 'active course',
				students: [student],
				untilDate: new Date(Date.now() + twoDaysInMilliSeconds),
			});
			const course2 = courseFactory.build({
				name: 'past course',
				students: [student],
				untilDate: new Date(Date.now() - twoDaysInMilliSeconds),
			});
			const course3 = courseFactory.build({
				name: 'timeless course',
				students: [student],
			});

			await em.persistAndFlush([course1, course2, course3]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student.id, { onlyActiveCourses: true });

			expect(checkEqualIds(result, [course1, course3])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should be able to sort by name', async () => {
			const user = userFactory.build();
			await em.persistAndFlush(user);

			const names = ['z course', 'a course', '_ course', 'A course', '2 course', 'h course'];
			const courses = names.map((name) => courseFactory.build({ name, students: [user] }));

			await em.persistAndFlush(courses);
			em.clear();

			const [result, count] = await repo.findAllByUserId(user.id, {}, { order: { name: SortOrder.asc } });

			const sortedNames = names.sort();

			expect(count).toEqual(courses.length);
			for (let i = 0; i < courses.length; i += 1) {
				expect(sortedNames[i]).toEqual(result[i].name);
			}
		});
	});

	describe('findAllForTeacher', () => {
		it('should find courses of teachers', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacher(user.id);

			expect(count).toEqual(1);
		});

		it('should find courses of teachers that are active', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacher(user.id, { onlyActiveCourses: true });

			expect(count).toEqual(1);
		});

		it('should "not" find courses of substitution teachers', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ substitutionTeachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacher(user.id);

			expect(count).toEqual(0);
		});

		it('should "not" find courses of students', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacherOrSubstituteTeacher(user.id);

			expect(count).toEqual(0);
		});
	});

	describe('findAllForTeacherOrSubstituteTeacher', () => {
		it('should find courses of teachers', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacherOrSubstituteTeacher(user.id);

			expect(count).toEqual(1);
		});

		it('should find courses of substitution teachers', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ substitutionTeachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacherOrSubstituteTeacher(user.id);

			expect(count).toEqual(1);
		});

		it('should "not" find courses of students', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacherOrSubstituteTeacher(user.id);

			expect(count).toEqual(0);
		});
	});

	describe('findOne', () => {
		it('should find any course', async () => {
			const course = courseFactory.build({ students: [] });

			await em.persistAndFlush([course]);

			const result = await repo.findOne(course.id);

			expect(result).toEqual(course);
		});

		it('should find course of student', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user] });

			await em.persistAndFlush([course]);

			const result = await repo.findOne(course.id, user.id);

			expect(result).toEqual(course);
		});

		it('should find course of teacher', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });

			await em.persistAndFlush([course]);

			const result = await repo.findOne(course.id, user.id);

			expect(result).toEqual(course);
		});

		it('should find course of substitutionTeacher', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ substitutionTeachers: [user] });

			await em.persistAndFlush([course]);

			const result = await repo.findOne(course.id, user.id);

			expect(result).toEqual(course);
		});

		it('should "not" find course user is not in', async () => {
			const user = userFactory.build();
			const course = courseFactory.build();

			await em.persistAndFlush([course, user]);

			const callFunction = () => repo.findOne(course.id, user.id);

			await expect(callFunction).rejects.toThrow(NotFoundError);
		});
	});

	describe('findById', () => {
		it('should find a course by its id', async () => {
			const course = courseFactory.build({ name: 'important course' });
			await em.persistAndFlush(course);
			em.clear();

			const foundCourse = await repo.findById(course.id);
			expect(foundCourse.name).toEqual('important course');
		});

		it('should throw error if the course cannot be found by id', async () => {
			const unknownId = new ObjectId().toHexString();
			await expect(async () => {
				await repo.findById(unknownId);
			}).rejects.toThrow();
		});

		it('should populate course groups', async () => {
			const course = courseFactory.buildWithId({});
			const courseGroup = courseGroupFactory.buildWithId({ course });

			await em.persistAndFlush([course, courseGroup]);
			em.clear();

			const foundCourse = await repo.findById(course.id);
			expect(foundCourse.courseGroups.isInitialized()).toEqual(true);
			expect(foundCourse.courseGroups[0].id).toEqual(courseGroup.id);
		});

		it('should populate course teachers, substitute teachers and students', async () => {
			const teacher = userFactory.buildWithId();
			const substitutionTeacher = userFactory.buildWithId();
			const student = userFactory.buildWithId();

			const course = courseFactory.buildWithId({
				teachers: [teacher],
				substitutionTeachers: [substitutionTeacher],
				students: [student],
			});
			await em.persistAndFlush([course, teacher, substitutionTeacher, student]);
			em.clear();

			const foundCourse = await repo.findById(course.id);
			expect(foundCourse.courseGroups.isInitialized()).toEqual(true);

			expect(foundCourse.teachers[0].id).toEqual(teacher.id);
			expect(foundCourse.substitutionTeachers[0].id).toEqual(substitutionTeacher.id);
			expect(foundCourse.students[0].id).toEqual(student.id);
		});
	});

	describe('unset optional property', () => {
		it('should remove a property that was set to undefined', async () => {
			const course = courseFactory.build({ students: [] });
			course.copyingSince = new Date();
			await em.persistAndFlush([course]);

			delete course.copyingSince;
			await repo.save(course);

			const result = await repo.findOne(course.id);

			expect(result.copyingSince).toBeUndefined();
			expect(Object.keys(result)).not.toContain('copyingSince');
		});
	});

	describe('update Courses', () => {
		describe('when user is existing', () => {
			const setup = async () => {
				const user = userFactory.build();
				const otherUser = userFactory.build();
				await em.persistAndFlush([user, otherUser]);
				const course1 = courseFactory.build({ name: 'course #1', students: [user, otherUser] });
				const course2 = courseFactory.build({ name: 'course #2', substitutionTeachers: [user, otherUser] });
				const course3 = courseFactory.build({ name: 'course #3', teachers: [user, otherUser] });
				const course4 = courseFactory.build({ name: 'course #1', students: [otherUser] });

				await em.persistAndFlush([course1, course2, course3, course4]);

				return {
					user,
					course1,
					course2,
					course3,
				};
			};

			it('should update Courses without deleted user', async () => {
				const { user, course1, course2, course3 } = await setup();

				// Arrange expected Array after User deletion
				course1.students.remove((u) => u.id === user.id);
				course2.substitutionTeachers.remove((u) => u.id === user.id);
				course3.teachers.remove((u) => u.id === user.id);

				// Act
				await repo.save([course1, course2, course3]);

				const [, count] = await repo.findAllByUserId(user.id);
				expect(count).toEqual(0);
			});
		});
	});
});
