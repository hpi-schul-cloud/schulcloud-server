import { createMock } from '@golevelup/ts-jest';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ContextExternalTool,
	ContextExternalToolDO,
	ContextExternalToolType,
	CustomParameterEntryDO,
	School,
	SchoolExternalTool,
} from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import {
	cleanupCollections,
	contextExternalToolDOFactory,
	contextExternalToolFactory,
	schoolExternalToolFactory,
	schoolFactory,
} from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { ContextExternalToolQuery } from '@src/modules/tool/uc/dto';
import { ToolContextType } from '@src/modules/tool/interface';
import { ContextExternalToolRepo } from './context-external-tool.repo';

describe('ContextExternalToolRepo', () => {
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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
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
		const school: School = schoolFactory.buildWithId();
		const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ school });
		const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.buildWithId({ school });
		const contextExternalTool1: ContextExternalTool = contextExternalToolFactory.buildWithId({
			schoolTool: schoolExternalTool1,
		});
		const contextExternalTool2: ContextExternalTool = contextExternalToolFactory.buildWithId({
			schoolTool: schoolExternalTool2,
		});
		const contextExternalTool3: ContextExternalTool = contextExternalToolFactory.buildWithId({
			schoolTool: schoolExternalTool1,
		});

		await em.persistAndFlush([
			schoolExternalTool1,
			schoolExternalTool2,
			contextExternalTool1,
			contextExternalTool2,
			contextExternalTool3,
		]);
		em.clear();

		return { schoolExternalTool1, schoolExternalTool2, contextExternalTool1 };
	};

	it('getEntityName should return ContextExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(ContextExternalTool);
	});

	describe('deleteBySchoolExternalToolIds', () => {
		it('should delete all ContextExternalTools with reference to one given SchoolExternalTool', async () => {
			const { schoolExternalTool1 } = await setup();

			const result: number = await repo.deleteBySchoolExternalToolIds([schoolExternalTool1.id]);

			expect(result).toEqual(2);
		});

		it('should delete all ContextExternalTools with reference to multiple given SchoolExternalTool', async () => {
			const { schoolExternalTool1, schoolExternalTool2 } = await setup();

			const result: number = await repo.deleteBySchoolExternalToolIds([schoolExternalTool1.id, schoolExternalTool2.id]);

			expect(result).toEqual(3);
		});

		it('should not delete any ContextExternalTools when no SchoolExternalTools are given', async () => {
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
					schoolToolRef: {
						schoolToolId: new ObjectId().toHexString(),
						schoolId: undefined,
					},
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
					schoolToolRef: {
						schoolToolId: new ObjectId().toHexString(),
					},
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
					.withSchoolExternalToolRef(schoolExternalTool1.id, schoolExternalTool1.school.id)
					.build({ contextId: undefined });

				const result: ContextExternalToolDO[] = await repo.find(query);

				expect(result[0].schoolToolRef.schoolToolId).toEqual(schoolExternalTool1.id);
			});

			it('should return all dos', async () => {
				await setup();
				const query: ContextExternalToolQuery = {};

				const result: ContextExternalToolDO[] = await repo.find(query);

				expect(result.length).toBeGreaterThan(0);
			});

			describe('when schoolToolId and contextId is set', () => {
				it('should return a do', async () => {
					const { schoolExternalTool1, contextExternalTool1 } = await setup();
					const query: ContextExternalToolDO = contextExternalToolDOFactory
						.withSchoolExternalToolRef(schoolExternalTool1.id, schoolExternalTool1.school.id)
						.build({ contextId: contextExternalTool1.contextId });

					const result: ContextExternalToolDO[] = await repo.find(query);

					expect(result[0].schoolToolRef.schoolToolId).toEqual(schoolExternalTool1.id);
					expect(result[0].contextId).toEqual(contextExternalTool1.contextId);
				});

				it('should return all dos', async () => {
					const { contextExternalTool1 } = await setup();
					const query: ContextExternalToolQuery = {
						schoolToolRef: { schoolToolId: contextExternalTool1.schoolTool.id },
						contextId: contextExternalTool1.contextId,
					};

					const result: ContextExternalToolDO[] = await repo.find(query);

					expect(result.length).toBeGreaterThan(0);
				});
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

				return { schoolExternalTool, unknownContextExternalTool };
			};

			it('should throw error ', async () => {
				const { schoolExternalTool, unknownContextExternalTool } = await contextSetup();
				const query: ContextExternalToolDO = contextExternalToolDOFactory
					.withSchoolExternalToolRef(schoolExternalTool.id, 'schoolId')
					.build({ contextId: unknownContextExternalTool.contextId });

				await expect(repo.find(query)).rejects.toThrow(new Error('Unknown ContextExternalToolType'));
			});
		});
	});
});
