import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { Coursegroup, Course, LearnroomTestHelper } from '@src/entities';
import { CoursegroupRepo } from './coursegroup.repo';

describe('coursegroup repo', () => {
	let module: TestingModule;
	let repo: CoursegroupRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Course, Coursegroup],
				}),
			],
			providers: [CoursegroupRepo],
		}).compile();
		repo = module.get(CoursegroupRepo);
		em = module.get<EntityManager>(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(Course, {});
		await em.nativeDelete(Coursegroup, {});
	});

	it('should be defined', () => {
		expect(repo).toBeDefined();
		expect(typeof repo.findByCourses).toEqual('function');
	});

	describe('findByCourses', () => {
		it('should return the right types', async () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const coursegroup = helper.createCoursegroup(course);

			await em.persistAndFlush([course, coursegroup]);

			const [result, count] = await repo.findByCourses([course]);

			expect(result).toBeInstanceOf(Array);
			expect(typeof count).toEqual('number');
			expect(result[0]).toBeInstanceOf(Coursegroup);
		});

		it('should return right keys', async () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			em.persist([course]);

			const coursegroup = helper.createCoursegroup(course);

			await em.persistAndFlush([coursegroup]);

			const [result] = await repo.findByCourses([course]);

			const keysOfFirstElements = Object.keys(result[0]).sort();
			const expectedResult = ['_id', 'courseId', 'updatedAt', 'createdAt', 'studentIds'].sort();
			expect(keysOfFirstElements).toEqual(expectedResult);
		});

		it('should return coursegroups of requested courses.', async () => {
			const helper = new LearnroomTestHelper();
			const course1 = helper.createStudentCourse();
			const course2 = helper.createStudentCourse();
			const course3 = helper.createStudentCourse();
			const courses = [course1, course2, course3];

			const groups = [
				helper.createCoursegroup(course1),
				helper.createCoursegroup(course1),
				helper.createCoursegroup(course2),
			];

			await em.persistAndFlush([...courses, ...groups]);

			const result = await repo.findByCourses(courses);
			const expectedResult = [groups, 3];
			expect(result).toEqual(expectedResult);
		});

		it('should only return coursegroups where the user is a member of it', async () => {
			const helper = new LearnroomTestHelper();
			const course1 = helper.createStudentCourse();
			const course2 = helper.createStudentCourse();

			const groups = [
				helper.createCoursegroup(course2),
				helper.createCoursegroup(course2),
				helper.createCoursegroup(course2),
			];

			await em.persistAndFlush([course1, course2, ...groups]);

			const result = await repo.findByCourses([course1]);
			const expectedResult = [[], 0];
			expect(result).toEqual(expectedResult);
		});
	});
});
