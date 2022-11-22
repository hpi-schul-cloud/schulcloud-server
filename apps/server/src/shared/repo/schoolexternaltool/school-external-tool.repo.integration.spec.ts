import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, schoolExternalToolFactory } from '@shared/testing';
import { SchoolExternalToolRepo } from '@shared/repo/schoolexternaltool/school-external-tool.repo';
import { SchoolExternalTool } from '@shared/domain';

describe('SchoolExternalToolRepo', () => {
	let module: TestingModule;
	let repo: SchoolExternalToolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SchoolExternalToolRepo],
		}).compile();
		repo = module.get(SchoolExternalToolRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	async function setup() {
		const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
		const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
		schoolExternalTool2.tool = schoolExternalTool.tool;
		schoolExternalTool2.school = schoolExternalTool.school;
		await em.persistAndFlush([schoolExternalTool, schoolExternalTool2]);
		const toolId = schoolExternalTool.tool.id;
		const schoolId = schoolExternalTool.school.id;
		return { schoolExternalTool, toolId, schoolId, schoolExternalTool2 };
	}

	it('getEntityName should return SchoolExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(SchoolExternalTool);
	});

	describe('findByToolIdAndSchoolId', () => {
		it('should find a schoolExternalTool with given toolId and schoolId', async () => {
			const { toolId, schoolId, schoolExternalTool } = await setup();

			const result: SchoolExternalTool | null = await repo.findByToolIdAndSchoolId(toolId, schoolId);

			expect(result).toEqual(expect.objectContaining(schoolExternalTool));
		});

		it('should return null when no schoolExternalTool with given toolId and schoolId', async () => {
			await setup();
			const notExisting = new ObjectId().toHexString();

			const result: SchoolExternalTool | null = await repo.findByToolIdAndSchoolId(notExisting, notExisting);

			expect(result).toBeNull();
		});
	});

	describe('findAllByToolId', () => {
		it('should find all schoolExternalTools with the given toolId', async () => {
			const { toolId, schoolExternalTool, schoolExternalTool2 } = await setup();

			const result: SchoolExternalTool[] = await repo.findAllByToolId(toolId);

			expect(result.length).toEqual([schoolExternalTool, schoolExternalTool2].length);
		});

		it('should return an empty array when no schoolExternalTools were found', async () => {
			await setup();
			const notExisting = new ObjectId().toHexString();

			const result: SchoolExternalTool[] = await repo.findAllByToolId(notExisting);

			expect(result.length).toEqual(0);
		});
	});

	describe('findAllBySchoolId', () => {
		it('should find all schoolExternalTools with given schoolId', async () => {
			const { schoolExternalTool, schoolExternalTool2, schoolId } = await setup();

			const result: SchoolExternalTool[] = await repo.findAllBySchoolId(schoolId);

			expect(result.length).toEqual([schoolExternalTool, schoolExternalTool2].length);
		});

		it('should return an empty array when no schoolExternalTools were found', async () => {
			await setup();
			const notExisting = new ObjectId().toHexString();

			const result: SchoolExternalTool[] = await repo.findAllBySchoolId(notExisting);

			expect(result.length).toEqual(0);
		});
	});
});
