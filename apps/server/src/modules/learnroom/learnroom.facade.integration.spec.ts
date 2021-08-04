import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';

import { MongoMemoryDatabaseModule } from '../database';
import { Course, Coursegroup } from './entity';
import { CourseRepo, CoursegroupRepo } from './repo';
import { CourseUC } from './uc';
import { LearnroomFacade } from './learnroom.facade';

import { LearnroomTestHelper } from './utils/testHelper';

describe('course repo', () => {
	let module: TestingModule;
	let facade: LearnroomFacade;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [Course, Coursegroup],
				}),
			],
			providers: [CourseRepo, CoursegroupRepo, CourseUC, LearnroomFacade],
		}).compile();

		facade = module.get(LearnroomFacade);

		em = module.get<EntityManager>(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await em.nativeDelete(Course, {});
	});

	it('should be defined', () => {
		expect(facade).toBeDefined();
		expect(typeof facade.findCoursesWithGroupsByUserId).toEqual('function');
	});

	describe('findCoursesWithGroupsByUserId', () => {
		it('should return courses with groups', async () => {
			const helper = new LearnroomTestHelper();

			const course1 = helper.createStudentCourse();
			const course2 = helper.createTeacherCourse();
			const course3 = helper.createSubstitutionCourse();
			const course4 = helper.createStudentCourse();

			await em.persistAndFlush([course1, course2, course3, course4]);

			const coursegroup1ForCourse1 = helper.createCoursegroup(course1);
			const coursegroup2ForCourse1 = helper.createCoursegroup(course1);
			const coursegroup1ForCourse2 = helper.createCoursegroup(course2);
			const coursegroup1ForCourse3 = helper.createCoursegroup(course3);

			await em.persistAndFlush([
				coursegroup1ForCourse1,
				coursegroup2ForCourse1,
				coursegroup1ForCourse2,
				coursegroup1ForCourse3,
			]);

			const [coursesWithGroups, count] = await facade.findCoursesWithGroupsByUserId(helper.userId);

			expect(count).toEqual(4);
			expect(coursesWithGroups).toHaveLength(4);
			// TODO: bad to select over index
			expect(coursesWithGroups[0].getGroups()).toHaveLength(2);
			expect(coursesWithGroups[1].getGroups()).toHaveLength(1);
			expect(coursesWithGroups[2].getGroups()).toHaveLength(1);
			expect(coursesWithGroups[3].getGroups()).toHaveLength(0);
		});
	});
});
