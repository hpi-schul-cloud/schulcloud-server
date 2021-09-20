import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { MongoMemoryDatabaseModule } from '@src/modules/database';

import { EntityId, Course, User, Role } from '@shared/domain';
import { userFactory } from '@shared/domain/factory';
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
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Course, User, Role],
				}),
			],
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
			await em.persistAndFlush(student);
			const course = new Course({ name: 'course #1', schoolId: new ObjectId(), studentIds: [student._id] });

			await em.persistAndFlush([course]);
			em.clear();

			const [result] = await repo.findAllByUserId(student.id);

			const keysOfFirstElements = Object.keys(result[0]).sort();
			const expectedResult = [
				'_id',
				'color',
				'createdAt',
				'description',
				'name',
				'schoolId',
				'substitutionTeacherIds',
				'teacherIds',
				'updatedAt',
				'studentIds',
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
			const course1 = new Course({ name: 'course #1', schoolId: new ObjectId(), teacherIds: [teacher._id] });
			const course2 = new Course({ name: 'course #2', schoolId: new ObjectId(), teacherIds: [teacher._id] });

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(teacher.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should return course of students', async () => {
			const student = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			await em.persistAndFlush(student);
			const course1 = new Course({ name: 'course #1', schoolId: new ObjectId(), studentIds: [student._id] });
			const course2 = new Course({ name: 'course #2', schoolId: new ObjectId(), studentIds: [student._id] });

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(student.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should return course of substitution teachers', async () => {
			const subTeacher = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			await em.persistAndFlush(subTeacher);
			const course1 = new Course({
				name: 'course #1',
				schoolId: new ObjectId(),
				substitutionTeacherIds: [subTeacher._id],
			});
			const course2 = new Course({
				name: 'course #2',
				schoolId: new ObjectId(),
				substitutionTeacherIds: [subTeacher._id],
			});

			await em.persistAndFlush([course1, course2]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(subTeacher.id);

			expect(checkEqualIds(result, [course1, course2])).toEqual(true);
			expect(count).toEqual(2);
		});

		it('should handle mixed roles in courses', async () => {
			const user = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			await em.persistAndFlush(user);
			const course1 = new Course({
				name: 'course #1',
				schoolId: new ObjectId(),
				studentIds: [user._id],
			});
			const course2 = new Course({
				name: 'course #2',
				schoolId: new ObjectId(),
				substitutionTeacherIds: [user._id],
			});
			const course3 = new Course({
				name: 'course #3',
				schoolId: new ObjectId(),
				teacherIds: [user._id],
			});

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
				new Course({
					name: 'course #1',
					schoolId: new ObjectId(),
					studentIds: [user._id],
				}),
				new Course({
					name: 'course #2',
					schoolId: new ObjectId(),
					substitutionTeacherIds: [user._id],
				}),
				new Course({
					name: 'course #3',
					schoolId: new ObjectId(),
					teacherIds: [user._id],
				}),
			];
			const otherCourses = [
				new Course({
					name: 'other course #1',
					schoolId: new ObjectId(),
					studentIds: [otherUser._id],
				}),
				new Course({
					name: 'other course #2',
					schoolId: new ObjectId(),
					substitutionTeacherIds: [otherUser._id],
				}),
				new Course({
					name: 'other course #3',
					schoolId: new ObjectId(),
					teacherIds: [otherUser._id],
				}),
			];

			await em.persistAndFlush([...courses, ...otherCourses]);
			em.clear();

			const [result, count] = await repo.findAllByUserId(user.id);

			expect(checkEqualIds(result, courses)).toEqual(true);
			expect(count).toEqual(3);
		});
	});
});
