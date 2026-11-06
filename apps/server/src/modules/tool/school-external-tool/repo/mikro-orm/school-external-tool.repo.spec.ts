import { createMock } from '@golevelup/ts-jest';
import { LegacyLogger } from '@infra/logger';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { schoolEntityFactory } from '@modules/school/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { CustomParameterEntry } from '../../../common/domain';
import { ExternalToolEntity } from '../../../external-tool/repo';
import { ExternalToolRepoMapper } from '../../../external-tool/repo/mikro-orm/mapper/external-tool.repo.mapper';
import { externalToolEntityFactory } from '../../../external-tool/testing';
import { type SchoolExternalTool } from '../../domain';
import { schoolExternalToolEntityFactory, schoolExternalToolFactory } from '../../testing';
import { type SchoolExternalToolQuery } from '../../uc/dto/school-external-tool.types';
import { SchoolExternalToolEntity } from './school-external-tool.entity';
import { SchoolExternalToolRepo } from './school-external-tool.repo';

describe(SchoolExternalToolRepo.name, () => {
	let module: TestingModule;
	let repo: SchoolExternalToolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [SchoolExternalToolEntity, ExternalToolEntity] })],
			providers: [
				SchoolExternalToolRepo,
				ExternalToolRepoMapper,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
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

	const createTools = () => {
		const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();
		const school = schoolEntityFactory.buildWithId();
		const schoolExternalTool1: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
			tool: externalToolEntity,
			school,
			isDeactivated: false,
		});
		const schoolExternalTool2: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId();
		const schoolExternalTool3: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
			tool: externalToolEntity,
			school,
			isDeactivated: true,
		});

		return { externalToolEntity, school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3 };
	};

	it('getEntityName should return SchoolExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(SchoolExternalToolEntity);
	});

	describe('deleteByToolId', () => {
		const setup = async () => {
			const { externalToolEntity, school, schoolExternalTool1, schoolExternalTool3 } = createTools();

			await em.persist([school, externalToolEntity, schoolExternalTool1, schoolExternalTool3]).flush();
			em.clear();

			return { externalToolEntity, school, schoolExternalTool1, schoolExternalTool3 };
		};

		it('should delete all SchoolExternalTools with reference to a given ExternalTool', async () => {
			const { externalToolEntity } = await setup();

			const result: number = await repo.deleteByExternalToolId(externalToolEntity.id);

			expect(result).toEqual(2);
		});
	});

	describe('findByToolId', () => {
		const setup = async () => {
			const { externalToolEntity, school, schoolExternalTool1, schoolExternalTool3 } = createTools();

			await em.persist([school, externalToolEntity, schoolExternalTool1, schoolExternalTool3]).flush();
			em.clear();

			return { externalToolEntity, school, schoolExternalTool1, schoolExternalTool3 };
		};

		it('should find all SchoolExternalTools with reference to a given ExternalTool', async () => {
			const { externalToolEntity, schoolExternalTool1, schoolExternalTool3 } = await setup();

			const result: SchoolExternalTool[] = await repo.findByExternalToolId(externalToolEntity.id);

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ id: schoolExternalTool1.id }),
					expect.objectContaining({ id: schoolExternalTool3.id }),
				])
			);
		});
	});

	describe('findBySchoolId', () => {
		describe('when searching for SchoolExternalTools by school id', () => {
			const setup = async () => {
				const { externalToolEntity, school, schoolExternalTool1, schoolExternalTool3 } = createTools();

				await em.persist([school, externalToolEntity, schoolExternalTool1, schoolExternalTool3]).flush();
				em.clear();

				return { externalToolEntity, school, schoolExternalTool1, schoolExternalTool3 };
			};

			it('should find all SchoolExternalTools with reference to a given school id', async () => {
				const { school, schoolExternalTool1, schoolExternalTool3 } = await setup();

				const result: SchoolExternalTool[] = await repo.findBySchoolId(school.id);

				expect(result).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ id: schoolExternalTool1.id }),
						expect.objectContaining({ id: schoolExternalTool3.id }),
					])
				);
			});
		});
	});

	describe('save', () => {
		it.each(['save', 'saveMany'] as const)(
			'should store activation and empty parameters through %s before querying again',
			async (method) => {
				const entity = schoolExternalToolEntityFactory.buildWithId({
					isDeactivated: true,
					schoolParameters: [{ name: 'old', value: 'value,with,commas' }],
				});
				await em.persist(entity).flush();
				const domainObject = await repo.findById(entity.id);
				domainObject.activate();
				domainObject.parameters.splice(0);

				if (method === 'save') {
					await repo.save(domainObject);
				} else {
					await repo.saveMany([domainObject]);
				}

				const stored = await em.getCollection(SchoolExternalToolEntity).findOne({ _id: entity._id });
				expect(stored).toMatchObject({
					_id: entity._id,
					isDeactivated: false,
					schoolParameters: [],
					school: entity.school._id,
					tool: entity.tool._id,
				});
				em.clear();
				const reloaded = await repo.find({
					schoolId: domainObject.schoolId,
					toolId: domainObject.toolId,
					isDeactivated: false,
				});
				expect(reloaded).toHaveLength(1);
				expect(reloaded[0].getProps()).toMatchObject({
					id: domainObject.id,
					parameters: [],
					isDeactivated: false,
				});
				await expect(
					repo.find({
						schoolId: domainObject.schoolId,
						toolId: domainObject.toolId,
						isDeactivated: true,
					})
				).resolves.toEqual([]);
			}
		);

		it('should upsert existing and new tools in one batch before any ORM read', async () => {
			const existing = schoolExternalToolEntityFactory.buildWithId({ isDeactivated: true });
			await em.persist(existing).flush();
			const updated = await repo.findById(existing.id);
			updated.activate();
			const newTool = externalToolEntityFactory.buildWithId();
			await em.persist(newTool).flush();
			const newDomainObject = schoolExternalToolFactory.build({
				schoolId: updated.schoolId,
				toolId: newTool.id,
				isDeactivated: false,
				parameters: [new CustomParameterEntry({ name: 'new', value: '["not","an","array"]' })],
			});

			await repo.saveMany([updated, newDomainObject]);

			const collection = em.getCollection(SchoolExternalToolEntity);
			expect(await collection.findOne({ _id: existing._id })).toMatchObject({ isDeactivated: false });
			expect(await collection.findOne({ _id: new ObjectId(newDomainObject.id) })).toMatchObject({
				isDeactivated: false,
				school: existing.school._id,
				tool: newTool._id,
				schoolParameters: [{ name: 'new', value: '["not","an","array"]' }],
			});
			em.clear();
			await expect(repo.findById(updated.id)).resolves.toMatchObject({ isDeactivated: false });
			const reloaded = await repo.findById(newDomainObject.id);
			expect(reloaded.getProps()).toEqual({
				id: newDomainObject.id,
				schoolId: newDomainObject.schoolId,
				toolId: newDomainObject.toolId,
				isDeactivated: false,
				parameters: newDomainObject.parameters,
			});
		});

		const setup = () => {
			const schoolExternalToolEntity: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
				school: schoolEntityFactory.buildWithId(),
				tool: externalToolEntityFactory.buildWithId(),
			});

			const domainObject: SchoolExternalTool = schoolExternalToolFactory.build({
				id: schoolExternalToolEntity.id,
				toolId: schoolExternalToolEntity.tool.id,
				parameters: [new CustomParameterEntry({ name: 'param', value: 'value' })],
				schoolId: schoolExternalToolEntity.school.id,
			});

			em.persist([schoolExternalToolEntity]);
			em.clear();

			return {
				domainObject,
			};
		};

		it('should save a SchoolExternalTool', async () => {
			const { domainObject } = setup();
			const expected = { ...domainObject };

			const result: SchoolExternalTool = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
			expect(result.id).toBeDefined();
		});
	});

	describe('find', () => {
		describe('when school is set', () => {
			const setup = async () => {
				const { school, schoolExternalTool1 } = createTools();

				await em.persist([school, schoolExternalTool1]).flush();
				em.clear();

				const query: SchoolExternalToolQuery = {
					schoolId: schoolExternalTool1.school.id,
				};

				return { query, schoolExternalTool1 };
			};

			it('should return a do', async () => {
				const { query, schoolExternalTool1 } = await setup();

				const result: SchoolExternalTool[] = await repo.find(query);

				expect(result[0].schoolId).toEqual(schoolExternalTool1.school.id);
			});
		});

		describe('when tool is set', () => {
			const setup = async () => {
				const { school, externalToolEntity, schoolExternalTool1 } = createTools();

				await em.persist([school, externalToolEntity, schoolExternalTool1]).flush();
				em.clear();

				const query: SchoolExternalToolQuery = {
					toolId: externalToolEntity.id,
				};

				return { query, schoolExternalTool1 };
			};

			it('should return a do', async () => {
				const { query, schoolExternalTool1 } = await setup();

				const result: SchoolExternalTool[] = await repo.find(query);

				expect(result[0].toolId).toEqual(schoolExternalTool1.tool.id);
			});
		});

		describe('when isDeactivated is given', () => {
			const setup = async () => {
				const { school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3 } = createTools();

				await em.persist([school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3]).flush();
				em.clear();

				return { schoolExternalTool1, schoolExternalTool2, schoolExternalTool3 };
			};

			describe('when deactivated is set to false', () => {
				it('should return all active school external tools', async () => {
					const { schoolExternalTool1, schoolExternalTool2 } = await setup();

					const result: SchoolExternalTool[] = await repo.find({ isDeactivated: false });

					expect(result).toHaveLength(2);
					expect(result[0].id).toEqual(schoolExternalTool1.id);
					expect(result[1].id).toEqual(schoolExternalTool2.id);
				});
			});

			describe('when deactivated is set to true', () => {
				it('should return all deactivated school external tools', async () => {
					const { schoolExternalTool3 } = await setup();

					const result: SchoolExternalTool[] = await repo.find({ isDeactivated: true });

					expect(result).toHaveLength(1);
					expect(result[0].id).toEqual(schoolExternalTool3.id);
				});
			});

			describe('when deactivated is undefined', () => {
				it('should return all school external tools', async () => {
					await setup();

					const result: SchoolExternalTool[] = await repo.find({ isDeactivated: undefined });

					expect(result).toHaveLength(3);
				});
			});
		});

		describe('when query is empty', () => {
			const setup = async () => {
				const { school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3 } = createTools();

				await em.persist([school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3]).flush();
				em.clear();

				const query: SchoolExternalToolQuery = {
					schoolId: undefined,
					toolId: undefined,
				};

				return { query, schoolExternalTool1 };
			};

			it('should return all dos', async () => {
				const { query } = await setup();

				const result: SchoolExternalTool[] = await repo.find(query);

				expect(result.length).toBeGreaterThan(0);
			});
		});
	});

	describe('deleteById', () => {
		const setup = async () => {
			const { schoolExternalTool1 } = createTools();

			await em.persist([schoolExternalTool1]).flush();
			em.clear();

			return { schoolExternalTool1 };
		};

		it('should delete a SchoolExternalTool', async () => {
			const { schoolExternalTool1 } = await setup();

			await repo.deleteById(schoolExternalTool1.id);

			const result: SchoolExternalTool[] = await repo.find({ schoolId: schoolExternalTool1.school.id });

			expect(result).toHaveLength(0);
		});
	});

	describe('findById', () => {
		const setup = async () => {
			const { schoolExternalTool1 } = createTools();

			await em.persist([schoolExternalTool1]).flush();
			em.clear();

			return { schoolExternalTool1 };
		};

		it('should find a SchoolExternalTool by id', async () => {
			const { schoolExternalTool1 } = await setup();

			const result: SchoolExternalTool = await repo.findById(schoolExternalTool1.id);

			expect(result.id).toEqual(schoolExternalTool1.id);
		});
	});
});
