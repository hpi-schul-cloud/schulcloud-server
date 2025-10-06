import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { courseEntityFactory, courseGroupEntityFactory } from '../testing';
import { CourseEntity } from './course.entity';
import { CourseRepo } from './course.repo';
import { CourseGroupEntity } from './coursegroup.entity';
import { schoolEntityFactory } from '@modules/school/testing';

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
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [CourseEntity, CourseGroupEntity] })],
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
		expect(repo.entityName).toBe(CourseEntity);
	});

	describe('findAllByUserId', () => {
		it('should return right keys', async () => {
			const student = userFactory.build();
			const course = courseEntityFactory.build({ school: student.school, students: [student] });

			await em.persistAndFlush(course);
			em.clear();

			const [result] = await repo.findAllByUserId(student.id, student.school.id);

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
				'excludeFromSync',
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
			const course1 = courseEntityFactory.build({ school: teacher.school, name: 'course #1', teachers: [teacher] });
			const course2 = courseEntityFactory.build({ school: teacher.school, name: 'course #2', teachers: [teacher] });

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(teacher.id, teacher.school.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should return course of students', async () => {
			const student = userFactory.build();
			const course1 = courseEntityFactory.build({ school: student.school, name: 'course #1', students: [student] });
			const course2 = courseEntityFactory.build({ school: student.school, name: 'course #2', students: [student] });

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student.id, student.school.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should return course of substitution teachers', async () => {
			const subTeacher = userFactory.build();
			await em.persistAndFlush(subTeacher);
			const course1 = courseEntityFactory.build({
				school: subTeacher.school,
				name: 'course #1',
				substitutionTeachers: [subTeacher],
			});
			const course2 = courseEntityFactory.build({
				school: subTeacher.school,
				name: 'course #2',
				substitutionTeachers: [subTeacher],
			});

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(subTeacher.id, subTeacher.school.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should handle mixed roles in courses', async () => {
			const user = userFactory.build();
			await em.persistAndFlush(user);
			const course1 = courseEntityFactory.build({ school: user.school, name: 'course #1', students: [user] });
			const course2 = courseEntityFactory.build({ school: user.school, name: 'course #2', teachers: [user] });
			const course3 = courseEntityFactory.build({
				school: user.school,
				name: 'course #3',
				substitutionTeachers: [user],
			});

			await em.persistAndFlush([course1, course2, course3]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(user.id, user.school.id);

			expect(checkEqualIds(result, [course1, course2, course3])).toEqual(true);
			expect(count).toEqual(3);
		});

		it('should only return courses when the user is a member of it', async () => {
			const user = userFactory.build();
			const otherUser = userFactory.build();
			await em.persistAndFlush([user, otherUser]);
			const courses = [
				courseEntityFactory.build({ school: user.school, name: 'course #1', students: [user] }),
				courseEntityFactory.build({ school: user.school, name: 'course #2', substitutionTeachers: [user] }),
				courseEntityFactory.build({ school: user.school, name: 'course #3', teachers: [user] }),
			];
			const otherCourses = [
				courseEntityFactory.build({ school: otherUser.school, name: 'course #1', students: [otherUser] }),
				courseEntityFactory.build({ school: otherUser.school, name: 'course #2', substitutionTeachers: [otherUser] }),
				courseEntityFactory.build({ school: otherUser.school, name: 'course #3', teachers: [otherUser] }),
			];

			await em.persistAndFlush([...courses, ...otherCourses]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(user.id, user.school.id);

			expect(checkEqualIds(result, courses)).toEqual(true);
			expect(count).toEqual(3);
		});

		it('should only return courses that are currently active', async () => {
			const student = userFactory.build();
			const twoDaysInMilliSeconds = 172800000;
			const course1 = courseEntityFactory.build({
				name: 'active course',
				school: student.school,
				students: [student],
				untilDate: new Date(Date.now() + twoDaysInMilliSeconds),
			});
			const course2 = courseEntityFactory.build({
				name: 'past course',
				school: student.school,
				students: [student],
				untilDate: new Date(Date.now() - twoDaysInMilliSeconds),
			});
			const course3 = courseEntityFactory.build({
				name: 'timeless course',
				school: student.school,
				students: [student],
			});

			await em.persistAndFlush([course1, course2, course3]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student.id, student.school.id, { onlyActiveCourses: true });

			expect(checkEqualIds(result, [course1, course3])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should be able to sort by name', async () => {
			const user = userFactory.build();
			await em.persistAndFlush(user);

			const names = ['z course', 'a course', '_ course', 'A course', '2 course', 'h course'];
			const courses = names.map((name) => courseEntityFactory.build({ name, school: user.school, students: [user] }));

			await em.persistAndFlush(courses);
			em.clear();

			const [result, count] = await repo.findAllByUserId(
				user.id,
				user.school.id,
				{},
				{ order: { name: SortOrder.asc } }
			);

			const sortedNames = names.sort();

			expect(count).toEqual(courses.length);
			for (let i = 0; i < courses.length; i += 1) {
				expect(sortedNames[i]).toEqual(result[i].name);
			}
		});

		it('should only return courses for the given user and schoolId', async () => {
			const user = userFactory.build();
			await em.persistAndFlush(user);

			const otherSchool = schoolEntityFactory.buildWithId();

			const course1 = courseEntityFactory.build({ name: 'school1 course', students: [user], school: user.school });
			const course2 = courseEntityFactory.build({ name: 'school2 course', students: [user], school: otherSchool });
			const course3 = courseEntityFactory.build({ name: 'school1 course 2', students: [user], school: user.school });

			await em.persistAndFlush([course1, course2, course3]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(user.id, user.school.id);

			expect(checkEqualIds(result, [course1, course3])).toEqual(true);
			expect(count).toEqual(2);
		});
	});

	describe('findAllForTeacher', () => {
		it('should find courses of teachers', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ school: user.school, teachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacher(user.id, user.school.id);

			expect(count).toEqual(1);
		});

		it('should find courses of teachers that are active', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ school: user.school, teachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacher(user.id, user.school.id, { onlyActiveCourses: true });

			expect(count).toEqual(1);
		});

		it('should "not" find courses of substitution teachers', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ substitutionTeachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacher(user.id, user.school.id);

			expect(count).toEqual(0);
		});

		it('should "not" find courses of students', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ students: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacherOrSubstituteTeacher(user.id, user.school.id);

			expect(count).toEqual(0);
		});
	});

	describe('findAllForTeacherOrSubstituteTeacher', () => {
		it('should find courses of teachers', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ school: user.school, teachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacherOrSubstituteTeacher(user.id, user.school.id);

			expect(count).toEqual(1);
		});

		it('should find courses of substitution teachers', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ school: user.school, substitutionTeachers: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacherOrSubstituteTeacher(user.id, user.school.id);

			expect(count).toEqual(1);
		});

		it('should "not" find courses of students', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ students: [user] });

			await em.persistAndFlush([course]);
			em.clear();

			const [, count] = await repo.findAllForTeacherOrSubstituteTeacher(user.id, user.school.id);

			expect(count).toEqual(0);
		});
	});

	describe('findOne', () => {
		it('should find any course', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ school: user.school, students: [user] });

			await em.persistAndFlush([course]);

			const result = await repo.findOneForUser(course.id, user.id, user.school.id);

			expect(result).toEqual(course);
		});

		it('should find course of student', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ school: user.school, students: [user] });

			await em.persistAndFlush([course]);

			const result = await repo.findOneForUser(course.id, user.id, user.school.id);

			expect(result).toEqual(course);
		});

		it('should find course of teacher', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ school: user.school, teachers: [user] });

			await em.persistAndFlush([course]);

			const result = await repo.findOneForUser(course.id, user.id, user.school.id);

			expect(result).toEqual(course);
		});

		it('should find course of substitutionTeacher', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build({ school: user.school, substitutionTeachers: [user] });

			await em.persistAndFlush([course]);

			const result = await repo.findOneForUser(course.id, user.id, user.school.id);

			expect(result).toEqual(course);
		});

		it('should "not" find course user is not in', async () => {
			const user = userFactory.build();
			const course = courseEntityFactory.build();

			await em.persistAndFlush([course, user]);

			const callFunction = () => repo.findOneForUser(course.id, user.id, user.school.id);

			await expect(callFunction).rejects.toThrow(NotFoundError);
		});
	});

	describe('findById', () => {
		it('should find a course by its id', async () => {
			const course = courseEntityFactory.build({ name: 'important course' });
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
			const course = courseEntityFactory.buildWithId({});
			const courseGroup = courseGroupEntityFactory.buildWithId({ course });

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

			const course = courseEntityFactory.buildWithId({
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
			const user = userFactory.build();
			const course = courseEntityFactory.build({ school: user.school, students: [user] });
			course.copyingSince = new Date();
			await em.persistAndFlush([course]);

			delete course.copyingSince;
			await repo.save(course);

			const result = await repo.findOneForUser(course.id, user.id, user.school.id);

			expect(result.copyingSince).toBeUndefined();
			expect(Object.keys(result)).not.toContain('copyingSince');
		});
	});

	describe('removeUserReference', () => {
		describe('when deleting a student from all courses', () => {
			const setup = async () => {
				const user = userFactory.build();
				const { school } = user;
				const otherUser = userFactory.build({ school: school });

				const course1 = courseEntityFactory.buildWithId({ school, name: 'course #1', students: [user, otherUser] });
				const course2 = courseEntityFactory.buildWithId({
					school,
					name: 'course #2',
					substitutionTeachers: [user, otherUser],
				});
				const course3 = courseEntityFactory.buildWithId({ school, name: 'course #3', teachers: [user, otherUser] });
				const course4 = courseEntityFactory.buildWithId({ school, name: 'course #4', students: [otherUser] });

				await em.persistAndFlush([user, otherUser, course1, course2, course3, course4]);
				em.clear();

				return {
					user,
					otherUser,
					course1,
					course2,
					course3,
					course4,
				};
			};

			it('should actually remove the user reference from the courses', async () => {
				const { user, course1, course2, course3 } = await setup();

				await repo.removeUserReference(user.id);

				const [result1] = await repo.findAllByUserId(user.id, user.school.id);
				expect(result1.length).toEqual(0);

				const courseEntity1 = await repo.findById(course1.id);
				expect(courseEntity1.getStudentIds()).not.toContain(user.id);

				const courseEntity2 = await repo.findById(course2.id);
				expect(courseEntity2.getSubstitutionTeacherIds()).not.toContain(user.id);

				const courseEntity3 = await repo.findById(course3.id);
				expect(courseEntity3.getTeacherIds()).not.toContain(user.id);
			});

			it('should return count of 3 courses updated', async () => {
				const { user } = await setup();

				const [, count] = await repo.removeUserReference(user.id);

				expect(count).toEqual(3);
			});

			it('should not affect other users in the same course', async () => {
				const { user, otherUser, course1 } = await setup();

				await repo.removeUserReference(user.id);

				const courseEntity1 = await repo.findById(course1.id);
				expect(courseEntity1.getStudentIds()).toContain(otherUser.id);
			});

			it('should not affect other courses', async () => {
				const { user, otherUser, course4 } = await setup();

				await repo.removeUserReference(user.id);

				const courseEntity1 = await repo.findById(course4.id);
				expect(courseEntity1.getStudentIds()).toEqual([otherUser.id]);
			});
		});

		describe('when deleting a student from specific courses', () => {
			const setup = async () => {
				const user = userFactory.build();
				const otherUser = userFactory.build();

				const course1 = courseEntityFactory.buildWithId({ name: 'course #1', students: [user, otherUser] });
				const course2 = courseEntityFactory.buildWithId({ name: 'course #2', substitutionTeachers: [user, otherUser] });
				const course3 = courseEntityFactory.buildWithId({ name: 'course #3', teachers: [user, otherUser] });
				const course4 = courseEntityFactory.buildWithId({ name: 'course #4', students: [otherUser] });

				await em.persistAndFlush([user, otherUser, course1, course2, course3, course4]);
				em.clear();

				return {
					user,
					otherUser,
					course1,
					course2,
					course3,
					course4,
				};
			};

			it('should only remove user reference from specified courseIds', async () => {
				const { user, otherUser, course1, course2, course3, course4 } = await setup();

				// Only remove from course1 and course3
				await repo.removeUserReference(user.id, [course1.id, course3.id]);

				// course1: user should be removed from students
				const updatedCourse1 = await repo.findById(course1.id);
				expect(updatedCourse1.getStudentIds()).not.toContain(user.id);

				// course3: user should be removed from teachers
				const updatedCourse3 = await repo.findById(course3.id);
				expect(updatedCourse3.getTeacherIds()).not.toContain(user.id);

				// course2: user should still be in substitutionTeachers
				const updatedCourse2 = await repo.findById(course2.id);
				expect(updatedCourse2.getSubstitutionTeacherIds()).toContain(user.id);

				// course4: user was never in this course
				const updatedCourse4 = await repo.findById(course4.id);
				expect(updatedCourse4.getStudentIds()).toContain(otherUser.id);
			});
		});
	});

	describe('removeUserFromCourses', () => {
		it('should remove user from all courses in a school', async () => {
			const school = schoolEntityFactory.buildWithId();
			const user = userFactory.build({ school });
			const userId = user.id;
			const schoolId = school.id;

			const course1 = courseEntityFactory.buildWithId({ school, teachers: [user] });
			const course2 = courseEntityFactory.buildWithId({ school, students: [user] });

			await em.persistAndFlush([course1, course2]);

			await repo.removeUserFromCourses(userId, schoolId);

			const updatedCourse1 = await em.findOneOrFail(CourseEntity, { id: course1.id });
			const updatedCourse2 = await em.findOneOrFail(CourseEntity, { id: course2.id });

			expect(updatedCourse1.teachers).not.toContain(userId);
			expect(updatedCourse2.students).not.toContain(userId);
		});
	});
});
