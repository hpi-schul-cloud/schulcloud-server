import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections, federalStateFactory, schoolFactory, systemFactory } from '@shared/testing';
import { SCHOOL_REPO } from '../../domain';
import { SchoolEntityMapper } from './mapper';
import { SchoolMikroOrmRepo } from './school.repo';

describe('SchoolMikroOrmRepo', () => {
	let module: TestingModule;
	let repo: SchoolMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [{ provide: SCHOOL_REPO, useClass: SchoolMikroOrmRepo }],
		}).compile();

		repo = module.get(SCHOOL_REPO);
		em = module.get(EntityManager);
	});

	afterEach(async () => {
		await cleanupCollections(em);
		await em.nativeDelete(SchoolEntity, {});
	});

	afterAll(async () => {
		await module.close();
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(SchoolEntity);
	});

	describe('getAllSchools', () => {
		describe('when no query and options are given', () => {
			const setup = async () => {
				const entities = schoolFactory.buildList(3);
				await em.persistAndFlush(entities);
				em.clear();
				const schools = entities.map((entity) => SchoolEntityMapper.mapToDo(entity));

				return { schools };
			};

			it('should return all schools', async () => {
				const { schools } = await setup();

				const result = await repo.getAllSchools({});

				expect(result).toEqual(schools);
			});
		});

		describe('when query is given', () => {
			const setup = async () => {
				const someFederalStateId = new ObjectId().toHexString();
				const federalState = federalStateFactory.buildWithId({}, someFederalStateId);
				const entity1 = schoolFactory.build({ federalState });
				const entity2 = schoolFactory.build();
				await em.persistAndFlush([entity1, entity2]);
				em.clear();
				const schoolDo1 = SchoolEntityMapper.mapToDo(entity1);
				const schoolDo2 = SchoolEntityMapper.mapToDo(entity2);

				const query = { federalStateId: someFederalStateId };

				return { schoolDo1, schoolDo2, query };
			};

			it('should return all schools matching query', async () => {
				const { schoolDo1, schoolDo2, query } = await setup();

				const result = await repo.getAllSchools(query);

				expect(result).toContainEqual(schoolDo1);
				expect(result).not.toContainEqual(schoolDo2);
			});
		});

		describe('when pagination option is given', () => {
			const setup = async () => {
				const entities = schoolFactory.buildList(3);
				await em.persistAndFlush(entities);
				em.clear();
				const schoolDos = entities.map((entity) => SchoolEntityMapper.mapToDo(entity));

				const options = {
					pagination: {
						skip: 1,
						limit: 1,
					},
				};

				return { schoolDos, options };
			};

			it('should return schools matching pagination', async () => {
				const { schoolDos, options } = await setup();

				const result = await repo.getAllSchools({}, options);

				expect(result).toEqual([schoolDos[1]]);
			});
		});

		describe('when order option is given', () => {
			const setup = async () => {
				const entity1 = schoolFactory.build({ name: 'bbb' });
				const entity2 = schoolFactory.build({ name: 'aaa' });
				await em.persistAndFlush([entity1, entity2]);
				em.clear();
				const schoolDo1 = SchoolEntityMapper.mapToDo(entity1);
				const schoolDo2 = SchoolEntityMapper.mapToDo(entity2);

				const options = {
					order: {
						name: SortOrder.asc,
					},
				};

				return { schoolDo1, schoolDo2, options };
			};

			it('should return schools in given order', async () => {
				const { schoolDo1, schoolDo2, options } = await setup();

				const result = await repo.getAllSchools({}, options);

				expect(result).toEqual([schoolDo2, schoolDo1]);
			});
		});
	});

	describe('getSchool', () => {
		it('should throw NotFound if entity is not found', async () => {
			const someId = new ObjectId().toHexString();

			await expect(() => repo.getSchool(someId)).rejects.toThrow(NotFoundError);
		});

		describe('when entity is found', () => {
			const setup = async () => {
				const systems = systemFactory.buildList(2);
				const someId = new ObjectId().toHexString();
				const entity = schoolFactory.buildWithId({ systems }, someId);
				await em.persistAndFlush([entity]);
				em.clear();
				const schoolDo = SchoolEntityMapper.mapToDo(entity);

				return { schoolDo, someId };
			};

			it('should return school with all refs populated', async () => {
				const { schoolDo, someId } = await setup();

				const result = await repo.getSchool(someId);

				expect(result).toEqual(schoolDo);
			});
		});
	});
});
