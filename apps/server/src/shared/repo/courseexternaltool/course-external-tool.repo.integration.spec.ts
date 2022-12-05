import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseExternalTool, SchoolExternalTool } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, courseExternalToolFactory, schoolExternalToolFactory } from '@shared/testing';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { Logger } from '@src/core/logger';
import { createMock } from '@golevelup/ts-jest';
import { CourseExternalToolRepo } from './course-external-tool.repo';
import { CourseExternalToolDO } from '../../domain/domainobject/external-tool/course-external-tool.do';
import { CustomParameterEntryDO } from '../../domain/domainobject/external-tool/custom-parameter-entry.do';

describe('CourseExternalToolRepo', () => {
	let module: TestingModule;
	let repo: CourseExternalToolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				CourseExternalToolRepo,
				ExternalToolRepoMapper,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
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
		const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
		const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
		const courseExternalTool1: CourseExternalTool = courseExternalToolFactory.buildWithId({
			schoolTool: schoolExternalTool1,
		});
		const courseExternalTool2: CourseExternalTool = courseExternalToolFactory.buildWithId({
			schoolTool: schoolExternalTool2,
		});
		const courseExternalTool3: CourseExternalTool = courseExternalToolFactory.buildWithId({
			schoolTool: schoolExternalTool1,
		});

		await em.persistAndFlush([
			schoolExternalTool1,
			schoolExternalTool2,
			courseExternalTool1,
			courseExternalTool2,
			courseExternalTool3,
		]);
		em.clear();

		return { schoolExternalTool1, schoolExternalTool2 };
	};

	it('getEntityName should return CourseExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(CourseExternalTool);
	});

	describe('deleteBySchoolExternalToolIds', () => {
		it('should delete all CourseExternalTools with reference to one given SchoolExternalTool', async () => {
			const { schoolExternalTool1 } = await setup();

			const result: number = await repo.deleteBySchoolExternalToolIds([schoolExternalTool1.id]);

			expect(result).toEqual(2);
		});

		it('should delete all CourseExternalTools with reference to multiple given SchoolExternalTool', async () => {
			const { schoolExternalTool1, schoolExternalTool2 } = await setup();

			const result: number = await repo.deleteBySchoolExternalToolIds([schoolExternalTool1.id, schoolExternalTool2.id]);

			expect(result).toEqual(3);
		});

		it('should not delete any CourseExternalTools when no SchoolExternalTools are given', async () => {
			await setup();

			const result: number = await repo.deleteBySchoolExternalToolIds([]);

			expect(result).toEqual(0);
		});
	});

	describe('save', () => {
		function setupDO() {
			const domainObject: CourseExternalToolDO = new CourseExternalToolDO({
				courseId: new ObjectId().toHexString(),
				parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
				schoolToolId: new ObjectId().toHexString(),
				toolVersion: 1,
			});

			return {
				domainObject,
			};
		}

		it('should save a CourseExternalTool', async () => {
			const { domainObject } = setupDO();
			const { id, updatedAt, createdAt, ...expected } = domainObject;

			const result: CourseExternalToolDO = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
			expect(result.id).toBeDefined();
			expect(result.updatedAt).toBeDefined();
			expect(result.createdAt).toBeDefined();
		});
	});
});
