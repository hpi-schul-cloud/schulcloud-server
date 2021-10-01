import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { MongoMemoryDatabaseModule } from '@src/modules/database';

import { EntityId, Course } from '@shared/domain';
import { userFactory } from '@shared/domain/factory';
import { courseFactory } from '@shared/domain/factory/course.factory';
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
		await em.nativeDelete(Course, {});
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findAllByUserId).toEqual('function');
	});

	describe('findAllByUserId', () => {
		it('should return right keys', async () => {
			const student = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			const course = courseFactory.build({ students: [student] });

			await em.persistAndFlush(course);
			em.clear();

			const [result] = await repo.findAllByUserId(student.id);

			const keysOfFirstElements = Object.keys(result[0]).sort();
			const expectedResult = [
				'_id',
				'color',
				'createdAt',
				'description',
				'name',
				'school',
				'substitutionTeachers',
				'teachers',
				'updatedAt',
				'students',
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
			const teacher = userFactory.build({ firstName: 'John', lastName: 'Doe' });
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
			const student = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			const course1 = courseFactory.build({ name: 'course #1', students: [student] });
			const course2 = courseFactory.build({ name: 'course #2', students: [student] });

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should return course of substitution teachers', async () => {
			const subTeacher = userFactory.build({ firstName: 'John', lastName: 'Doe' });
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
			const user = userFactory.build({ firstName: 'John', lastName: 'Doe' });
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

		it('should only return courses where the user is a member of it', async () => {
			const user = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			const otherUser = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
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
	});
});
