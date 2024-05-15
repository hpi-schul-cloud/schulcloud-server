import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Course, CourseGroup } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { courseFactory, courseGroupFactory } from '@shared/testing/factory';
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
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [CourseGroupRepo],
		}).compile();
		repo = module.get(CourseGroupRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(Course, {});
		await em.nativeDelete(CourseGroup, {});
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findByCourseIds).toEqual('function');
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(CourseGroup);
	});

	describe('findById', () => {
		it('should return courseGroup with populated course', async () => {
			const course = courseFactory.build();
			const courseGroup = courseGroupFactory.build({ course });
			await em.persistAndFlush(courseGroup);
			em.clear();

			const result = await repo.findById(courseGroup.id);

			expect(result.course?.name).toEqual(course.name);
		});
	});

	describe('findByCourses', () => {
		it('should return the right types', async () => {
			const courseGroup = courseGroupFactory.build();
			await em.persistAndFlush(courseGroup);
			em.clear();

			const [result, count] = await repo.findByCourseIds([courseGroup.course.id]);

			expect(result).toBeInstanceOf(Array);
			expect(typeof count).toEqual('number');
			expect(result[0]).toBeInstanceOf(CourseGroup);
		});

		it('should return right keys', async () => {
			const courseGroup = courseGroupFactory.build();
			await em.persistAndFlush(courseGroup);
			em.clear();

			const [result] = await repo.findByCourseIds([courseGroup.course.id]);

			const keysOfFirstElements = Object.keys(result[0]).sort();
			const expectedResult = ['_id', 'name', 'course', 'updatedAt', 'createdAt', 'school', 'students'].sort();
			expect(keysOfFirstElements).toEqual(expectedResult);
		});

		it('should return course groups of requested courses.', async () => {
			const course1 = courseFactory.build({ name: 'course #1' });
			const course2 = courseFactory.build({ name: 'course #2' });
			const course3 = courseFactory.build({ name: 'course #3' });
			const courses = [course1, course2, course3];
			await em.persistAndFlush(courses);

			const courseGroups = [
				courseGroupFactory.build({ course: course1 }),
				courseGroupFactory.build({ course: course2 }),
				courseGroupFactory.build({ course: course3 }),
			];
			await em.persistAndFlush(courseGroups);
			em.clear();

			const [result, count] = await repo.findByCourseIds(courses.map((o) => o.id));
			expect(checkEqualIds(result, courseGroups)).toEqual(true);
			expect(count).toEqual(3);
		});

		it('should only return course groups when the user is a member of it', async () => {
			const course1 = courseFactory.build({ name: 'course #1' });
			const course2 = courseFactory.build({ name: 'course #2' });
			const courses = [course1, course2];
			await em.persistAndFlush(courses);

			const courseGroups = [
				courseGroupFactory.build({ course: course2 }),
				courseGroupFactory.build({ course: course2 }),
				courseGroupFactory.build({ course: course2 }),
			];
			await em.persistAndFlush(courseGroups);
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
				const course = courseFactory.build();
				const courseGroup1 = courseGroupFactory.studentsWithId(3).build({ course });
				const courseGroup2 = courseGroupFactory.build({ course });
				const userId = courseGroup1.students[0].id;
				await em.persistAndFlush([courseGroup1, courseGroup2]);

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

	describe('update courseGroup', () => {
		describe('when user is existing', () => {
			const setup = async () => {
				// Arrange
				const course = courseFactory.build();
				const courseGroup1 = courseGroupFactory.studentsWithId(3).build({ course });
				const courseGroup2 = courseGroupFactory.build({ course });
				const userId = courseGroup1.students[0].id;
				await em.persistAndFlush([courseGroup1, courseGroup2]);

				return {
					userId,
					courseGroup1,
				};
			};

			it('should update courseGroup without userId', async () => {
				const { userId, courseGroup1 } = await setup();

				// Arrange expected Array after User deletion
				courseGroup1.students.remove((s) => s.id === userId);

				// Act
				await repo.save(courseGroup1);

				const [, count] = await repo.findByUserId(userId);

				expect(count).toEqual(0);
			});
		});
	});
});
