import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../database';
import { Coursegroup, Course } from '../entity';
import { CoursegroupRepo } from './coursegroup.repo';

import { LearnroomTestHelper } from '../testHelper';

describe('coursegroup repo', () => {
	let module: TestingModule;
	let repo: CoursegroupRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Coursegroup, Course],
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
		it('should return the right type', async () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			await em.persistAndFlush([course]);

			const coursegroup = helper.createCoursegroup(course);

			await em.persistAndFlush([coursegroup]);

			const [result, count] = await repo.findByCourses([course]);

			expect(result).toBeInstanceOf(Array);
			expect(typeof count).toEqual('number');
			expect(result[0]).toBeInstanceOf(Coursegroup);
		});

		it('should return right keys', async () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			await em.persistAndFlush([course]);

			const coursegroup = helper.createCoursegroup(course);

			await em.persistAndFlush([coursegroup]);

			const [result] = await repo.findByCourses([course]);

			const keysOfFirstElements = Object.keys(result[0]).sort();
			const expectedResult = ['_id', 'courseId', 'updatedAt', 'createdAt', 'studentIds'].sort();
			expect(keysOfFirstElements).toEqual(expectedResult);
		});

		it('should return coursegroups if user is a member.', async () => {
			const helper = new LearnroomTestHelper();
			const course1 = helper.createStudentCourse();
			const course2 = helper.createStudentCourse();
			const course3 = helper.createStudentCourse();
			const courses = [course1, course2, course3];

			await em.persistAndFlush(courses);

			const groups = [
				helper.createCoursegroup(course1),
				helper.createCoursegroup(course1),
				helper.createCoursegroup(course2),
			];

			await em.persistAndFlush(groups);

			const result = await repo.findByCourses(courses);
			const expectedResult = [groups, 2];
			expect(result).toEqual(expectedResult);
		});

		it.todo('should only return coursegroups where the user is a member of it');
	});
});
