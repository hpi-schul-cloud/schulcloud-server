import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { CustomParameterEntry } from '@modules/tool/common/domain';
import { ExternalToolEntity } from '@modules/tool/external-tool/entity';
import { externalToolEntityFactory } from '@modules/tool/external-tool/testing';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { schoolExternalToolEntityFactory } from '@modules/tool/school-external-tool/testing';
import { SchoolExternalToolQuery } from '@modules/tool/school-external-tool/uc/dto/school-external-tool.types';
import { Test, TestingModule } from '@nestjs/testing';
import { type SchoolEntity } from '@shared/domain/entity';
import { ExternalToolRepoMapper } from '@shared/repo/externaltool/external-tool.repo.mapper';
import {
	cleanupCollections,
	schoolEntityFactory,
	schoolExternalToolConfigurationStatusEntityFactory,
} from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';

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
		const externalToolEntity: ExternalToolEntity = externalToolEntityFactory.buildWithId();
		const school: SchoolEntity = schoolEntityFactory.buildWithId();
		const schoolExternalTool1: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
			tool: externalToolEntity,
			school,
			status: schoolExternalToolConfigurationStatusEntityFactory.build({ isDeactivated: false }),
		});
		const schoolExternalTool2: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
			status: undefined,
		});
		const schoolExternalTool3: SchoolExternalToolEntity = schoolExternalToolEntityFactory.buildWithId({
			tool: externalToolEntity,
			school,
			status: schoolExternalToolConfigurationStatusEntityFactory.build({ isDeactivated: true }),
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

				await em.persistAndFlush([school, externalToolEntity, schoolExternalTool1, schoolExternalTool3]);
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
		function setup() {
			const domainObject: SchoolExternalTool = new SchoolExternalTool({
				toolId: new ObjectId().toHexString(),
				parameters: [new CustomParameterEntry({ name: 'param', value: 'value' })],
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

			const result: SchoolExternalTool = await repo.save(domainObject);

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

				const result: SchoolExternalTool[] = await repo.find(query);

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

				const result: SchoolExternalTool[] = await repo.find(query);

				expect(result[0].toolId).toEqual(schoolExternalTool1.tool.id);
			});
		});

		describe('when isDeactivated is given', () => {
			const setup = async () => {
				const { school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3 } = createTools();

				await em.persistAndFlush([school, schoolExternalTool1, schoolExternalTool2, schoolExternalTool3]);
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

				const result: SchoolExternalTool[] = await repo.find(query);

				expect(result.length).toBeGreaterThan(0);
			});
		});
	});
});
