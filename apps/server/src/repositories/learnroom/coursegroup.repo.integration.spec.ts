import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { EntityId, CourseGroup, Course, User, Role } from '@shared/domain';
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
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Course, CourseGroup, User, Role],
				}),
			],
			providers: [CourseGroupRepo],
		}).compile();
		repo = module.get(CourseGroupRepo);
		em = module.get<EntityManager>(EntityManager);
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

	describe('findByCourses', () => {
		it('should return the right types', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			await em.persistAndFlush(course);
			const courseGroup = new CourseGroup({ courseId: course._id });
			await em.persistAndFlush(courseGroup);
			em.clear();

			const [result, count] = await repo.findByCourseIds([course.id]);

			expect(result).toBeInstanceOf(Array);
			expect(typeof count).toEqual('number');
			expect(result[0]).toBeInstanceOf(CourseGroup);
		});

		it('should return right keys', async () => {
			const course = new Course({ name: 'course #1', schoolId: new ObjectId() });
			await em.persistAndFlush(course);
			const courseGroup = new CourseGroup({ courseId: course._id });
			await em.persistAndFlush(courseGroup);
			em.clear();

			const [result] = await repo.findByCourseIds([course.id]);

			const keysOfFirstElements = Object.keys(result[0]).sort();
			const expectedResult = ['_id', 'courseId', 'updatedAt', 'createdAt', 'students'].sort();
			expect(keysOfFirstElements).toEqual(expectedResult);
		});

		it('should return course groups of requested courses.', async () => {
			const course1 = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const course2 = new Course({ name: 'course #2', schoolId: new ObjectId() });
			const course3 = new Course({ name: 'course #3', schoolId: new ObjectId() });
			const courses = [course1, course2, course3];
			await em.persistAndFlush(courses);

			const courseGroups = [
				new CourseGroup({ courseId: course1._id }),
				new CourseGroup({ courseId: course2._id }),
				new CourseGroup({ courseId: course3._id }),
			];
			await em.persistAndFlush(courseGroups);
			em.clear();

			const [result, count] = await repo.findByCourseIds(courses.map((o) => o.id));
			expect(checkEqualIds(result, courseGroups)).toEqual(true);
			expect(count).toEqual(3);
		});

		it('should only return course groups where the user is a member of it', async () => {
			const course1 = new Course({ name: 'course #1', schoolId: new ObjectId() });
			const course2 = new Course({ name: 'course #2', schoolId: new ObjectId() });
			const courses = [course1, course2];
			await em.persistAndFlush(courses);

			const courseGroups = [
				new CourseGroup({ courseId: course2._id }),
				new CourseGroup({ courseId: course2._id }),
				new CourseGroup({ courseId: course2._id }),
			];
			await em.persistAndFlush(courseGroups);
			em.clear();

			const [result, count] = await repo.findByCourseIds([course2.id]);
			expect(checkEqualIds(result, courseGroups)).toEqual(true);
			expect(count).toEqual(3);
		});
	});
});
