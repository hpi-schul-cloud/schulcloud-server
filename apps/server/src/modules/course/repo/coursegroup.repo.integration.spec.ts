import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { courseEntityFactory, courseGroupEntityFactory } from '../testing';
import { CourseEntity } from './course.entity';
import { CourseGroupEntity } from './coursegroup.entity';
import { CourseGroupRepo } from './coursegroup.repo';

const checkEqualIds = (arr1: { id: EntityId }[], arr2: { id: EntityId }[]): boolean => {
	const ids2 = arr2.map((o) => o.id);
	const isEqual = arr1.every((o) => ids2.includes(o.id));
	return isEqual;
};

describe('course group repo', () => {
	let module: TestingModule;
	let repo: CourseGroupRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [CourseEntity, CourseGroupEntity] })],
			providers: [CourseGroupRepo],
		}).compile();
		repo = module.get(CourseGroupRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(CourseEntity, {});
		await em.nativeDelete(CourseGroupEntity, {});
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findByCourseIds).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(CourseGroupEntity);
	});

	describe('findById', () => {
		it('should return courseGroup with populated course', async () => {
			const course = courseEntityFactory.build();
			const courseGroup = courseGroupEntityFactory.build({ course });
			await em.persist(courseGroup).flush();
			em.clear();

			const result = await repo.findById(courseGroup.id);

			expect(result.course?.name).toEqual(course.name);
		});
	});

	describe('findByCourses', () => {
		it('should return the right types', async () => {
			const courseGroup = courseGroupEntityFactory.build();
			await em.persist(courseGroup).flush();
			em.clear();

			const [result, count] = await repo.findByCourseIds([courseGroup.course.id]);

			expect(result).toBeInstanceOf(Array);
			expect(typeof count).toEqual('number');
			expect(result[0]).toBeInstanceOf(CourseGroupEntity);
		});

		it('should return right keys', async () => {
			const courseGroup = courseGroupEntityFactory.build();
			await em.persist(courseGroup).flush();
			em.clear();

			const [result] = await repo.findByCourseIds([courseGroup.course.id]);

			const keysOfFirstElements = Object.keys(result[0]).sort();
			const expectedResult = ['_id', 'name', 'course', 'updatedAt', 'createdAt', 'school', 'students'].sort();
			expect(keysOfFirstElements).toEqual(expectedResult);
		});

		it('should return course groups of requested courses.', async () => {
			const course1 = courseEntityFactory.build({ name: 'course #1' });
			const course2 = courseEntityFactory.build({ name: 'course #2' });
			const course3 = courseEntityFactory.build({ name: 'course #3' });
			const courses = [course1, course2, course3];
			await em.persist(courses).flush();

			const courseGroups = [
				courseGroupEntityFactory.build({ course: course1 }),
				courseGroupEntityFactory.build({ course: course2 }),
				courseGroupEntityFactory.build({ course: course3 }),
			];
			await em.persist(courseGroups).flush();
			em.clear();

			const [result, count] = await repo.findByCourseIds(courses.map((o) => o.id));
			expect(checkEqualIds(result, courseGroups)).toEqual(true);
			expect(count).toEqual(3);
		});

		it('should only return course groups when the user is a member of it', async () => {
			const course1 = courseEntityFactory.build({ name: 'course #1' });
			const course2 = courseEntityFactory.build({ name: 'course #2' });
			const courses = [course1, course2];
			await em.persist(courses).flush();

			const courseGroups = [
				courseGroupEntityFactory.build({ course: course2 }),
				courseGroupEntityFactory.build({ course: course2 }),
				courseGroupEntityFactory.build({ course: course2 }),
			];
			await em.persist(courseGroups).flush();
			em.clear();

			const [result, count] = await repo.findByCourseIds([course2.id]);
			expect(checkEqualIds(result, courseGroups)).toEqual(true);
			expect(count).toEqual(3);
		});
	});

	describe('findByUserId', () => {
		describe('when user is existing', () => {
			const setup = async () => {
				// Arrange
				const course = courseEntityFactory.build();
				const courseGroup1 = courseGroupEntityFactory.studentsWithId(3).build({ course });
				const courseGroup2 = courseGroupEntityFactory.build({ course });
				const userId = courseGroup1.students[0].id;
				await em.persist([courseGroup1, courseGroup2]).flush();

				return {
					userId,
				};
			};

			it('should return courseGroup with userId', async () => {
				const { userId } = await setup();

				// Act
				const [result, count] = await repo.findByUserId(userId);

				expect(count).toEqual(1);
				expect(result[0].students[0].id).toEqual(userId);
			});
		});
	});

	describe('removeUserReference', () => {
		describe('when user is existing', () => {
			const setup = async () => {
				// Arrange
				const course = courseEntityFactory.build();
				const courseGroup1 = courseGroupEntityFactory.studentsWithId(3).build({ course });
				const courseGroup2 = courseGroupEntityFactory.studentsWithId(2).build({ course });
				const userId = courseGroup1.students[0].id;
				await em.persist([courseGroup1, courseGroup2]).flush();
				em.clear();

				return {
					userId,
					courseGroup1,
					courseGroup2,
				};
			};

			it('should remove user from course group', async () => {
				const { userId, courseGroup1 } = await setup();

				await repo.removeUserReference(userId);

				const result = await repo.findById(courseGroup1.id);
				const studentList = result.getStudentIds();
				expect(studentList).not.toContain(userId);
			});

			it('should return the number of removed users', async () => {
				const { userId } = await setup();

				const result = await repo.removeUserReference(userId);

				expect(result).toEqual(1);
			});

			it('should not affect other course groups', async () => {
				const { userId, courseGroup2 } = await setup();

				await repo.removeUserReference(userId);

				const result = await repo.findById(courseGroup2.id);
				const studentList = result.getStudentIds();
				expect(studentList).toEqual(courseGroup2.getStudentIds());
			});
		});
	});
});
