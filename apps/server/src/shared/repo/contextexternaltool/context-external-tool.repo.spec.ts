import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { CustomParameterEntry } from '@modules/tool/common/domain';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool, ContextExternalToolProps } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolEntity, ContextExternalToolType } from '@modules/tool/context-external-tool/entity';
import {
	contextExternalToolEntityFactory,
	contextExternalToolFactory,
} from '@modules/tool/context-external-tool/testing';
import { ContextExternalToolQuery } from '@modules/tool/context-external-tool/uc/dto/context-external-tool.types';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { LegacyLogger } from '@src/core/logger';
import { cleanupCollections, schoolEntityFactory } from '../../testing';
import { ContextExternalToolRepo } from './context-external-tool.repo';

describe(ContextExternalToolRepo.name, () => {
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
		const school: SchoolEntity = schoolEntityFactory.buildWithId();
		const schoolExternalTool1: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({ school });
		const schoolExternalTool2: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({ school });
		const contextExternalTool1: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
			schoolTool: schoolExternalTool1,
		});
		const contextExternalTool2: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
			schoolTool: schoolExternalTool2,
		});
		const contextExternalTool3: ContextExternalToolEntity = contextExternalToolEntityFactory.buildWithId({
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
			expect(entityName).toEqual(ContextExternalToolEntity);
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
		describe('when context is course', () => {
			function setup() {
				const domainObject: ContextExternalTool = contextExternalToolFactory.build({
					displayName: 'displayName',
					contextRef: {
						id: new ObjectId().toHexString(),
						type: ToolContextType.COURSE,
					},
					parameters: [new CustomParameterEntry({ name: 'param', value: 'value' })],
					schoolToolRef: {
						schoolToolId: new ObjectId().toHexString(),
						schoolId: undefined,
					},
				});

				return {
					domainObject,
				};
			}

			it('should save a ContextExternalTool', async () => {
				const { domainObject } = setup();

				const result: ContextExternalTool = await repo.save(domainObject);

				expect(result).toMatchObject({
					...domainObject.getProps(),
					id: expect.any(String),
				});
			});
		});

		describe('when context is board card', () => {
			function setup() {
				const domainObject: ContextExternalTool = contextExternalToolFactory.build({
					displayName: 'displayName',
					contextRef: {
						id: new ObjectId().toHexString(),
						type: ToolContextType.BOARD_ELEMENT,
					},
					parameters: [new CustomParameterEntry({ name: 'param', value: 'value' })],
					schoolToolRef: {
						schoolToolId: new ObjectId().toHexString(),
						schoolId: undefined,
					},
				});

				return {
					domainObject,
				};
			}

			it('should save a ContextExternalTool', async () => {
				const { domainObject } = setup();

				const result: ContextExternalTool = await repo.save(domainObject);

				expect(result).toMatchObject({
					...domainObject.getProps(),
					id: expect.any(String),
				});
			});
		});

		describe('when context is unknown', () => {
			const setup = () => {
				const domainObject: ContextExternalTool = contextExternalToolFactory.build({
					contextRef: {
						id: new ObjectId().toHexString(),
						type: 'UNKNOWN' as ToolContextType,
					},
					displayName: 'displayName',
					parameters: [new CustomParameterEntry({ name: 'param', value: 'value' })],
					schoolToolRef: {
						schoolToolId: new ObjectId().toHexString(),
					},
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

				const result: ContextExternalTool[] = await repo.find(query);

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

				const result: ContextExternalTool[] = await repo.find(query);

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

				const result: ContextExternalTool[] = await repo.find(query);

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

				const result: ContextExternalTool[] = await repo.find(query);

				expect(result).toEqual([]);
			});
		});
	});

	describe('findById', () => {
		describe('when a ContextExternalTool is found', () => {
			const setup = async () => {
				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId();
				const contextExternalTool = contextExternalToolEntityFactory.buildWithId({
					contextType: ContextExternalToolType.COURSE,
					schoolTool: schoolExternalTool,
				});

				await em.persistAndFlush([schoolExternalTool, contextExternalTool]);

				return {
					contextExternalTool,
					schoolExternalTool,
				};
			};

			it('should return a context external tool', async () => {
				const { contextExternalTool, schoolExternalTool } = await setup();

				const result: ContextExternalTool = await repo.findById(contextExternalTool.id);

				expect(result.getProps()).toEqual<ContextExternalToolProps>({
					id: contextExternalTool.id,
					contextRef: {
						id: contextExternalTool.contextId,
						type: ToolContextType.COURSE,
					},
					displayName: contextExternalTool.displayName,
					parameters: [
						{
							name: contextExternalTool.parameters[0].name,
							value: contextExternalTool.parameters[0].value,
						},
					],
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.school.id,
					},
				});
			});
		});
	});

	describe('findByIdOrNull', () => {
		describe('when a ContextExternalTool is found', () => {
			const setup = async () => {
				const schoolExternalTool = schoolExternalToolEntityFactory.buildWithId();
				const contextExternalTool = contextExternalToolEntityFactory.buildWithId({
					contextType: ContextExternalToolType.COURSE,
					schoolTool: schoolExternalTool,
				});

				await em.persistAndFlush([schoolExternalTool, contextExternalTool]);

				return {
					contextExternalTool,
					schoolExternalTool,
				};
			};

			it('should return a context external tool', async () => {
				const { contextExternalTool, schoolExternalTool } = await setup();

				const result: ContextExternalTool | null = await repo.findByIdOrNull(contextExternalTool.id);

				expect(result?.getProps()).toEqual<ContextExternalToolProps>({
					id: contextExternalTool.id,
					contextRef: {
						id: contextExternalTool.contextId,
						type: ToolContextType.COURSE,
					},
					displayName: contextExternalTool.displayName,
					parameters: [
						{
							name: contextExternalTool.parameters[0].name,
							value: contextExternalTool.parameters[0].value,
						},
					],
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id,
						schoolId: schoolExternalTool.school.id,
					},
				});
			});
		});

		describe('when no ContextExternalTool is found', () => {
			it('should should return null', async () => {
				const result: ContextExternalTool | null = await repo.findByIdOrNull(new ObjectId().toHexString());

				expect(result).toBeNull();
			});
		});
	});

	describe('findBySchoolToolIdsAndContextType', () => {
		describe('when a ContextExternalTool is found for the selected context', () => {
			const setup = async () => {
				const schoolExternalTool1: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId();
				const schoolExternalTool2: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId();

				const contextExternalToolsInCourses: ContextExternalToolEntity[] = contextExternalToolEntityFactory.buildList(
					4,
					{
						contextType: ContextExternalToolType.COURSE,
						schoolTool: schoolExternalTool1,
					}
				);

				const contextExternalToolsOnBoards: ContextExternalToolEntity[] = contextExternalToolEntityFactory.buildList(
					2,
					{
						contextType: ContextExternalToolType.BOARD_ELEMENT,
						schoolTool: schoolExternalTool2,
					}
				);

				await em.persistAndFlush([
					schoolExternalTool1,
					schoolExternalTool2,
					...contextExternalToolsInCourses,
					...contextExternalToolsOnBoards,
				]);

				return {
					schoolExternalTool1,
					schoolExternalTool2,
				};
			};

			it('should return the context external tools of that context', async () => {
				const { schoolExternalTool1, schoolExternalTool2 } = await setup();

				const result: ContextExternalTool[] = await repo.findBySchoolToolIdsAndContextType(
					[schoolExternalTool1.id, schoolExternalTool2.id],
					ContextExternalToolType.COURSE
				);

				expect(result).toHaveLength(4);
			});
		});
	});
});
