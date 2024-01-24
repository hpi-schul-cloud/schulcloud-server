import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SortOrder } from '@shared/domain/interface';
import { cleanupCollections, federalStateFactory, schoolFactory, systemEntityFactory } from '@shared/testing';
import { countyEmbeddableFactory } from '@shared/testing/factory/county.embeddable.factory';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
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

	describe('getSchools', () => {
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

				const result = await repo.getSchools({});

				expect(result).toEqual(schools);
			});
		});

		describe('when query is given', () => {
			const setup = async () => {
				const federalState = federalStateFactory.build();
				const entity1 = schoolFactory.build({ federalState });
				const entity2 = schoolFactory.build();
				await em.persistAndFlush([entity1, entity2]);
				em.clear();
				const schoolDo1 = SchoolEntityMapper.mapToDo(entity1);
				const schoolDo2 = SchoolEntityMapper.mapToDo(entity2);

				const query = { federalStateId: federalState.id };

				return { schoolDo1, schoolDo2, query };
			};

			it('should return all schools matching query', async () => {
				const { schoolDo1, schoolDo2, query } = await setup();

				const result = await repo.getSchools(query);

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

				const result = await repo.getSchools({}, options);

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

				const result = await repo.getSchools({}, options);

				expect(result).toEqual([schoolDo2, schoolDo1]);
			});
		});
	});

	describe('getSchoolById', () => {
		describe('when entity is not found', () => {
			it('should throw NotFound', async () => {
				const someId = new ObjectId().toHexString();

				await expect(() => repo.getSchoolById(someId)).rejects.toThrow(NotFoundError);
			});
		});

		describe('when entity is found', () => {
			const setup = async () => {
				const systems = systemEntityFactory.buildList(2);
				const county = countyEmbeddableFactory.build();
				const schoolId = new ObjectId().toHexString();
				const entity = schoolFactory.buildWithId({ systems, county }, schoolId);
				await em.persistAndFlush([entity]);
				em.clear();
				const schoolDo = SchoolEntityMapper.mapToDo(entity);

				return { schoolDo, schoolId };
			};

			it('should return school', async () => {
				const { schoolDo, schoolId } = await setup();

				const result = await repo.getSchoolById(schoolId);

				expect(result).toEqual(schoolDo);
			});
		});
	});

	describe('getSchoolsForLdapLogin', () => {
		describe('when some schools have active LDAP systems', () => {
			const setup = async () => {
				const activeLdapSystem = systemEntityFactory.build({ type: 'ldap', ldapConfig: { active: true } });
				const inactiveLdapSystem = systemEntityFactory.build({ type: 'ldap', ldapConfig: { active: false } });
				const activeLdapSystemWithOauthConfig = systemEntityFactory.build({
					type: 'ldap',
					ldapConfig: { active: true },
					oauthConfig: {},
				});
				const otherSystem = systemEntityFactory.build({ type: 'test' });
				const entity1 = schoolFactory.build({ systems: [activeLdapSystem] });
				const entity2 = schoolFactory.build({ systems: [otherSystem, activeLdapSystem] });
				const entity3 = schoolFactory.build({ systems: [inactiveLdapSystem] });
				const entity4 = schoolFactory.build({ systems: [otherSystem] });
				const entity5 = schoolFactory.build();
				const entity6 = schoolFactory.build({ systems: [activeLdapSystemWithOauthConfig] });
				await em.persistAndFlush([entity1, entity2, entity3, entity4, entity5, entity6]);
				em.clear();
				const schoolDo1 = SchoolEntityMapper.mapToDo(entity1);
				const schoolDo2 = SchoolEntityMapper.mapToDo(entity2);
				const schoolDo3 = SchoolEntityMapper.mapToDo(entity3);
				const schoolDo4 = SchoolEntityMapper.mapToDo(entity4);
				const schoolDo5 = SchoolEntityMapper.mapToDo(entity5);
				const schoolDo6 = SchoolEntityMapper.mapToDo(entity6);

				return { schoolDo1, schoolDo2, schoolDo3, schoolDo4, schoolDo5, schoolDo6 };
			};

			it('should return only these schools', async () => {
				const { schoolDo1, schoolDo2, schoolDo3, schoolDo4, schoolDo5, schoolDo6 } = await setup();

				const result = await repo.getSchoolsForLdapLogin();

				expect(result).toContainEqual(schoolDo1);
				expect(result).toContainEqual(schoolDo2);
				expect(result).not.toContainEqual(schoolDo3);
				expect(result).not.toContainEqual(schoolDo4);
				expect(result).not.toContainEqual(schoolDo5);
				expect(result).not.toContainEqual(schoolDo6);
			});
		});
	});
});
