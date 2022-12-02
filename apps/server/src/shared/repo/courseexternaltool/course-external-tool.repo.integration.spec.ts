import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, courseExternalToolFactory } from '@shared/testing';
import { CourseExternalToolRepo } from '@shared/repo/courseexternaltool/course-external-tool.repo';
import { CourseExternalTool } from '@shared/domain';

describe('CourseExternalToolRepo', () => {
	let module: TestingModule;
	let repo: CourseExternalToolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [CourseExternalToolRepo],
		}).compile();
		repo = module.get(CourseExternalToolRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	const setup = async () => {
		const courseExternalTool: CourseExternalTool = courseExternalToolFactory.buildWithId();
		const courseExternalTool2: CourseExternalTool = courseExternalToolFactory.buildWithId();
		courseExternalTool2.schoolTool = courseExternalTool.schoolTool;
		courseExternalTool2.course = courseExternalTool.course;
		await em.persistAndFlush([courseExternalTool, courseExternalTool2]);
		const { schoolTool } = courseExternalTool;
		const { course } = courseExternalTool;
		return { courseExternalTool, schoolTool, course };
	};

	it('getEntityName should return CourseExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(CourseExternalTool);
	});

	describe('findBySchoolToolIdAndCourseId', () => {
		it('should find a course external tool with given schoolToolId and courseId', async () => {
			const { schoolTool, course, courseExternalTool } = await setup();

			const result: CourseExternalTool | null = await repo.findBySchoolToolIdAndCourseId(schoolTool.id, course.id);

			expect(result).toEqual(expect.objectContaining(courseExternalTool));
		});

		it('should return null if course external tool was not found', async () => {
			await setup();
			const notExisting = new ObjectId().toHexString();

			const result: CourseExternalTool | null = await repo.findBySchoolToolIdAndCourseId(notExisting, notExisting);

			expect(result).toBeNull();
		});
	});

	describe('findAllBySchoolToolId', () => {
		it('should find two course external tools with given schoolToolId', async () => {
			const { schoolTool } = await setup();

			const result: CourseExternalTool[] = await repo.findAllBySchoolToolId(schoolTool.id);

			expect(result.length).toEqual(2);
		});

		it('should return an empty array when no courseExternalTools were found', async () => {
			await setup();
			const notExisting = new ObjectId().toHexString();

			const result: CourseExternalTool[] = await repo.findAllBySchoolToolId(notExisting);

			expect(result.length).toEqual(0);
		});
	});

	describe('findAllByCourseId', () => {
		it('should find two course external tool with given courseId', async () => {
			const { course } = await setup();

			const result: CourseExternalTool[] = await repo.findAllByCourseId(course.id);

			expect(result.length).toEqual(2);
		});

		it('should return an empty array when no courseExternalTools were found', async () => {
			await setup();
			const notExisting = new ObjectId().toHexString();

			const result: CourseExternalTool[] = await repo.findAllByCourseId(notExisting);

			expect(result.length).toEqual(0);
		});
	});
});
