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
import { ContextExternalToolQuery } from '@src/modules/tool/context-external-tool/uc/dto/context-external-tool.types';
import { ToolContextType } from '@src/modules/tool/common/interface';
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

	const createExternalTools = () => {
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

		return {
			schoolExternalTool1,
			schoolExternalTool2,
			contextExternalTool1,
			contextExternalTool2,
			contextExternalTool3,
		};
	};

	describe('getEntityName', () => {
		it('should return ContextExternalTool', () => {
			const { entityName } = repo;
			expect(entityName).toEqual(ContextExternalTool);
		});
	});

	describe('deleteBySchoolExternalToolIds', () => {
		const setup = async () => {
			const {
				schoolExternalTool1,
				schoolExternalTool2,
				contextExternalTool1,
				contextExternalTool2,
				contextExternalTool3,
			} = createExternalTools();

			await em.persistAndFlush([
				schoolExternalTool1,
				schoolExternalTool2,
				contextExternalTool1,
				contextExternalTool2,
				contextExternalTool3,
			]);

			return { schoolExternalTool1, schoolExternalTool2, contextExternalTool1 };
		};

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
			function setup() {
				const domainObject: ContextExternalToolDO = contextExternalToolDOFactory.build({
					displayName: 'displayName',
					contextRef: {
						id: new ObjectId().toHexString(),
						type: ToolContextType.COURSE,
					},
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
				const { domainObject } = setup();
				const { id, ...expected } = domainObject;

				const result: ContextExternalToolDO = await repo.save(domainObject);

				expect(result).toMatchObject(expected);
				expect(result.id).toBeDefined();
			});
		});

		describe('when context is unknown', () => {
			const setup = () => {
				const domainObject: ContextExternalToolDO = contextExternalToolDOFactory.build({
					contextRef: {
						id: new ObjectId().toHexString(),
						type: 'UNKNOWN' as ToolContextType,
					},
					displayName: 'displayName',
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
				const { domainObject } = setup();

				await expect(repo.save(domainObject)).rejects.toThrow(new Error('Unknown ToolContextType'));
			});
		});
	});

	describe('find', () => {
		describe('when matches found for schoolToolId', () => {
			const setup = async () => {
				const { schoolExternalTool1, contextExternalTool1 } = createExternalTools();

				await em.persistAndFlush([schoolExternalTool1, contextExternalTool1]);

				return {
					schoolExternalTool1,
				};
			};

			it('should return correct results', async () => {
				const { schoolExternalTool1 } = await setup();

				const query: ContextExternalToolQuery = {
					schoolToolRef: { schoolToolId: schoolExternalTool1.id },
				};

				const result: ContextExternalToolDO[] = await repo.find(query);

				expect(result[0].schoolToolRef.schoolToolId).toEqual(schoolExternalTool1.id);
			});
		});

		describe('when matches found for contextId', () => {
			const setup = async () => {
				const { schoolExternalTool1, contextExternalTool1 } = createExternalTools();

				await em.persistAndFlush([schoolExternalTool1, contextExternalTool1]);

				return {
					contextExternalTool1,
				};
			};

			it('should return correct results ', async () => {
				const { contextExternalTool1 } = await setup();

				const query: ContextExternalToolQuery = {
					context: {
						id: contextExternalTool1.contextId,
					},
				};

				const result: ContextExternalToolDO[] = await repo.find(query);

				expect(result[0].contextRef.id).toEqual(contextExternalTool1.contextId);
			});
		});

		describe('when matches found for contextType', () => {
			const setup = async () => {
				const { schoolExternalTool1, contextExternalTool1 } = createExternalTools();

				await em.persistAndFlush([schoolExternalTool1, contextExternalTool1]);

				const query: ContextExternalToolQuery = {
					context: {
						type: ToolContextType.COURSE,
					},
				};

				return {
					query,
				};
			};

			it('should return correct results', async () => {
				const { query } = await setup();

				const result: ContextExternalToolDO[] = await repo.find(query);

				expect(result[0].contextRef.type).toEqual(ToolContextType.COURSE);
			});
		});

		describe('when context type is unknown', () => {
			const setup = async () => {
				const { contextExternalTool1 } = createExternalTools();
				contextExternalTool1.contextType = 'UNKNOWN' as ContextExternalToolType;
				await em.persistAndFlush(contextExternalTool1);
				em.clear();

				const query: ContextExternalToolQuery = {
					context: {
						id: contextExternalTool1.contextId,
					},
				};

				return {
					query,
				};
			};

			it('should throw error', async () => {
				const { query } = await setup();

				await expect(repo.find(query)).rejects.toThrow(new Error('Unknown ContextExternalToolType'));
			});
		});

		describe('when no matches found', () => {
			const setup = async () => {
				const { schoolExternalTool1 } = createExternalTools();
				await em.persistAndFlush(schoolExternalTool1);
				em.clear();

				const query: ContextExternalToolQuery = {
					schoolToolRef: { schoolToolId: new ObjectId().toHexString() },
					context: {
						id: new ObjectId().toHexString(),
						type: ToolContextType.COURSE,
					},
				};

				return {
					query,
				};
			};

			it('should return empty array', async () => {
				const { query } = await setup();

				const result: ContextExternalToolDO[] = await repo.find(query);

				expect(result).toEqual([]);
			});
		});
	});
});
