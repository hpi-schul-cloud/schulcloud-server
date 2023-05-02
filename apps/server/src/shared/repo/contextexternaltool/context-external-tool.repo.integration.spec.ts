import { createMock } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ContextExternalTool,
	ContextExternalToolDO,
	ContextExternalToolType,
	CustomParameterEntryDO,
	SchoolExternalTool,
} from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import {
	cleanupCollections,
	contextExternalToolDOFactory,
	contextExternalToolFactory,
	schoolExternalToolFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ContextExternalToolQuery } from '@src/modules/tool/uc/dto';
import { ContextExternalToolRepo } from './context-external-tool.repo';
import { ToolContextType } from '../../../modules/tool/interface';

describe('CourseExternalToolRepo', () => {
	let module: TestingModule;
	let repo: ContextExternalToolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				ContextExternalToolRepo,
				ExternalToolRepoMapper,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		repo = module.get(ContextExternalToolRepo);
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
		const courseExternalTool1: ContextExternalTool = contextExternalToolFactory.buildWithId({
			schoolTool: schoolExternalTool1,
		});
		const courseExternalTool2: ContextExternalTool = contextExternalToolFactory.buildWithId({
			schoolTool: schoolExternalTool2,
		});
		const courseExternalTool3: ContextExternalTool = contextExternalToolFactory.buildWithId({
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
		expect(entityName).toEqual(ContextExternalTool);
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
		describe('when context is known', () => {
			function setupDO() {
				const domainObject: ContextExternalToolDO = contextExternalToolDOFactory.build({
					contextToolName: 'displayName',
					contextId: new ObjectId().toHexString(),
					parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
					schoolToolId: new ObjectId().toHexString(),
					toolVersion: 1,
				});

				return {
					domainObject,
				};
			}

			it('should save a ContextExternalToolDO', async () => {
				const { domainObject } = setupDO();
				const { id, updatedAt, createdAt, ...expected } = domainObject;

				const result: ContextExternalToolDO = await repo.save(domainObject);

				expect(result).toMatchObject(expected);
				expect(result.id).toBeDefined();
				expect(result.updatedAt).toBeDefined();
				expect(result.createdAt).toBeDefined();
			});
		});

		describe('when context is unknown', () => {
			const contextSetup = () => {
				const domainObject: ContextExternalToolDO = contextExternalToolDOFactory.build({
					contextType: 'UNKNOWN' as ToolContextType,
					contextToolName: 'displayName',
					contextId: new ObjectId().toHexString(),
					parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
					schoolToolId: new ObjectId().toHexString(),
					toolVersion: 1,
				});

				return {
					domainObject,
				};
			};
			it('should throw error ', async () => {
				const { domainObject } = contextSetup();

				await expect(repo.save(domainObject)).rejects.toThrow(new Error('Unknown ToolContextType'));
			});
		});
	});

	describe('find is called', () => {
		describe('when schoolToolId is set', () => {
			it('should return a do', async () => {
				const { schoolExternalTool1 } = await setup();
				const query: ContextExternalToolDO = contextExternalToolDOFactory
					.withSchoolToolId(schoolExternalTool1.id)
					.build();

				const result: ContextExternalToolDO[] = await repo.find(query);

				expect(result[0].schoolToolId).toEqual(schoolExternalTool1.id);
			});

			it('should return all dos', async () => {
				await setup();
				const query: ContextExternalToolQuery = contextExternalToolDOFactory.build();
				query.schoolToolId = undefined;

				const result: ContextExternalToolDO[] = await repo.find(query);

				expect(result.length).toBeGreaterThan(0);
			});
		});

		describe('when contextToolType is unknown ', () => {
			const contextSetup = async () => {
				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId();

				const unknownContextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolTool: schoolExternalTool,
					contextType: 'Default' as ContextExternalToolType,
				});

				await em.persistAndFlush([schoolExternalTool, unknownContextExternalTool]);
				em.clear();

				return { schoolExternalTool };
			};

			it('should throw error ', async () => {
				const { schoolExternalTool } = await contextSetup();
				const query: ContextExternalToolDO = contextExternalToolDOFactory
					.withSchoolToolId(schoolExternalTool.id)
					.build();

				await expect(repo.find(query)).rejects.toThrow(new Error('Unknown ContextExternalToolType'));
			});
		});
	});
});
