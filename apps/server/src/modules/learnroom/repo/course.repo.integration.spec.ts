import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../database';
import { Course } from '../entity';
import { CourseRepo } from './course.repo';

import { LearnroomTestHelper } from '../testHelper';

describe('course repo', () => {
	let module: TestingModule;
	let repo: CourseRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Course],
				}),
			],
			providers: [CourseRepo],
		}).compile();
		repo = module.get(CourseRepo);
		em = module.get<EntityManager>(EntityManager);
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
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			await em.persistAndFlush([course]);
			const [result] = await repo.findAllByUserId(helper.userId);

			const keysOfFirstElements = Object.keys(result[0]).sort();
			const expectedResult = [
				'_id',
				// 'classIds',
				'color',
				'createdAt',
				'description',
				// 'features',
				'name',
				'schoolId',
				'substitutionTeacherIds',
				'teacherIds',
				'updatedAt',
				'studentIds',
			].sort();
			expect(keysOfFirstElements).toEqual(expectedResult);
		});

		it('should return course of teachers', async () => {
			const helper = new LearnroomTestHelper();
			const courses = [helper.createTeacherCourse(), helper.createTeacherCourse()];

			await em.persistAndFlush(courses);
			const result = await repo.findAllByUserId(helper.userId);

			const expectedResult = [courses, 2];
			expect(result).toEqual(expectedResult);
		});

		it('should return course of students', async () => {
			const helper = new LearnroomTestHelper();
			const courses = [helper.createStudentCourse(), helper.createStudentCourse()];

			await em.persistAndFlush(courses);
			const result = await repo.findAllByUserId(helper.userId);

			const expectedResult = [courses, 2];
			expect(result).toEqual(expectedResult);
		});

		it('should return course of substitution teachers', async () => {
			const helper = new LearnroomTestHelper();
			const courses = [helper.createTeacherCourse(), helper.createTeacherCourse()];

			await em.persistAndFlush(courses);
			const result = await repo.findAllByUserId(helper.userId);

			const expectedResult = [courses, 2];
			expect(result).toEqual(expectedResult);
		});

		it('should only return courses where the user is a member of it', async () => {
			const helper = new LearnroomTestHelper();
			const courses = [helper.createStudentCourse(), helper.createTeacherCourse(), helper.createSubstitutionCourse()];

			const helperOther = new LearnroomTestHelper();
			const otherCourses = [
				helperOther.createStudentCourse(),
				helperOther.createTeacherCourse(),
				helperOther.createSubstitutionCourse(),
			];

			await em.persistAndFlush([...courses, ...otherCourses]);
			const result = await repo.findAllByUserId(helper.userId);

			const expectedResult = [courses, 3];
			expect(result).toEqual(expectedResult);
		});
	});
});
