import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { type School } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import { cleanupCollections, externalToolFactory, schoolExternalToolFactory, schoolFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { createMock } from '@golevelup/ts-jest';
import { SchoolExternalToolQuery } from '@src/modules/tool/school-external-tool/uc/dto/school-external-tool.types';
import { ExternalToolEntity } from '@src/modules/tool/external-tool/entity';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/entity';
import { CustomParameterEntryDO } from '@src/modules/tool/common/domain';
import { SchoolExternalToolDO } from '@src/modules/tool/school-external-tool/domain';
import { SchoolExternalToolRepo } from './school-external-tool.repo';

describe('SchoolExternalToolRepo', () => {
	let module: TestingModule;
	let repo: SchoolExternalToolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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
		const externalToolEntity: ExternalToolEntity = externalToolFactory.buildWithId();
		const school: School = schoolFactory.buildWithId();
		const schoolExternalTool1: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
			tool: externalToolEntity,
			school,
		});
		const schoolExternalTool2: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
		const schoolExternalTool3: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
			tool: externalToolEntity,
			school,
		});

		return { externalToolEntity, school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3 };
	};

	it('getEntityName should return SchoolExternalTool', () => {
		const { entityName } = repo;
		expect(entityName).toEqual(SchoolExternalTool);
	});

	describe('deleteByToolId', () => {
		const setup = async () => {
			const { externalToolEntity, school, schoolExternalTool1, schoolExternalTool3 } = createTools();

			await em.persistAndFlush([school, externalToolEntity, schoolExternalTool1, schoolExternalTool3]);
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

			await em.persistAndFlush([school, externalToolEntity, schoolExternalTool1, schoolExternalTool3]);
			em.clear();

			return { externalToolEntity, school, schoolExternalTool1, schoolExternalTool3 };
		};

		it('should find all SchoolExternalTools with reference to a given ExternalTool', async () => {
			const { externalToolEntity, schoolExternalTool1, schoolExternalTool3 } = await setup();

			const result: SchoolExternalToolDO[] = await repo.findByExternalToolId(externalToolEntity.id);

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

				await em.persistAndFlush([school, externalToolEntity, schoolExternalTool1, schoolExternalTool3]);
				em.clear();

				return { externalToolEntity, school, schoolExternalTool1, schoolExternalTool3 };
			};

			it('should find all SchoolExternalTools with reference to a given school id', async () => {
				const { school, schoolExternalTool1, schoolExternalTool3 } = await setup();

				const result: SchoolExternalToolDO[] = await repo.findBySchoolId(school.id);

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
		function setup() {
			const domainObject: SchoolExternalToolDO = new SchoolExternalToolDO({
				toolId: new ObjectId().toHexString(),
				parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
				schoolId: new ObjectId().toHexString(),
				toolVersion: 1,
			});

			return {
				domainObject,
			};
		}

		it('should save a SchoolExternalTool', async () => {
			const { domainObject } = setup();
			const { id, ...expected } = domainObject;

			const result: SchoolExternalToolDO = await repo.save(domainObject);

			expect(result).toMatchObject(expected);
			expect(result.id).toBeDefined();
		});
	});

	describe('find is called', () => {
		describe('when school is set', () => {
			const setup = async () => {
				const { school, schoolExternalTool1 } = createTools();

				await em.persistAndFlush([school, schoolExternalTool1]);
				em.clear();

				const query: SchoolExternalToolQuery = {
					schoolId: schoolExternalTool1.school.id,
				};

				return { query, schoolExternalTool1 };
			};

			it('should return a do', async () => {
				const { query, schoolExternalTool1 } = await setup();

				const result: SchoolExternalToolDO[] = await repo.find(query);

				expect(result[0].schoolId).toEqual(schoolExternalTool1.school.id);
			});
		});

		describe('when tool is set', () => {
			const setup = async () => {
				const { school, externalToolEntity, schoolExternalTool1 } = createTools();

				await em.persistAndFlush([school, externalToolEntity, schoolExternalTool1]);
				em.clear();

				const query: SchoolExternalToolQuery = {
					toolId: externalToolEntity.id,
				};

				return { query, schoolExternalTool1 };
			};

			it('should return a do', async () => {
				const { query, schoolExternalTool1 } = await setup();

				const result: SchoolExternalToolDO[] = await repo.find(query);

				expect(result[0].toolId).toEqual(schoolExternalTool1.tool.id);
			});
		});

		describe('when query is empty', () => {
			const setup = async () => {
				const { school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3 } = createTools();

				await em.persistAndFlush([school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3]);
				em.clear();

				const query: SchoolExternalToolQuery = {
					schoolId: undefined,
					toolId: undefined,
				};

				return { query, schoolExternalTool1 };
			};

			it('should return all dos', async () => {
				const { query } = await setup();

				const result: SchoolExternalToolDO[] = await repo.find(query);

				expect(result.length).toBeGreaterThan(0);
			});
		});
	});
});
