import { faker } from '@faker-js/faker';
import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { countyEmbeddableFactory, federalStateEntityFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { systemEntityFactory } from '@modules/system/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType, SortOrder } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { FileStorageType, SCHOOL_REPO, SchoolFeature, SchoolPurpose } from '../domain';
import { countyFactory, federalStateDoFactory, schoolEntityFactory, schoolFactory } from '../testing';
import { FederalStateEntityMapper, SchoolEntityMapper, SchoolYearEntityMapper } from './mapper';
import { SchoolEntity } from './school.entity';
import { SchoolMikroOrmRepo } from './school.repo';

describe('SchoolMikroOrmRepo', () => {
	let module: TestingModule;
	let repo: SchoolMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [SchoolEntity] })],
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
				const entities = schoolEntityFactory.buildList(3);
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
				const federalState = federalStateDoFactory.build();
				const externalId = faker.string.uuid();
				const systems = systemEntityFactory.buildList(1);
				const entity1 = schoolEntityFactory.build({ federalState, externalId, systems });
				const entity2 = schoolEntityFactory.build();
				await em.persistAndFlush([entity1, entity2]);
				em.clear();
				const schoolDo1 = SchoolEntityMapper.mapToDo(entity1);
				const schoolDo2 = SchoolEntityMapper.mapToDo(entity2);

				const query = { federalStateId: federalState.id, externalId, systemId: systems[0].id };

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
				const entities = schoolEntityFactory.buildList(3);
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
				const entity1 = schoolEntityFactory.build({ name: 'bbb' });
				const entity2 = schoolEntityFactory.build({ name: 'aaa' });
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

	describe('getExternalSchools', () => {
		describe('when no options are given', () => {
			const setup = async () => {
				const entities = schoolEntityFactory.buildList(3);
				await em.persistAndFlush(entities);
				em.clear();

				return { entities };
			};

			it('should return the count of all schools', async () => {
				const { entities } = await setup();

				const { count } = await repo.getExternalSchools({}, 'ownSchoolId');

				expect(count).toEqual(entities.length);
			});
		});

		describe('when pagination option is given', () => {
			const setup = async () => {
				const entities = schoolEntityFactory.buildList(3);
				await em.persistAndFlush(entities);
				em.clear();

				return { entities };
			};

			it('should return the count of all schools and the schools matching pagination', async () => {
				const { entities } = await setup();
				const options = {
					pagination: {
						skip: 1,
						limit: 1,
					},
				};

				const { schools, count } = await repo.getExternalSchools({}, 'ownSchoolId', options);

				expect(count).toEqual(entities.length);
				expect(schools.length).toEqual(1);

				const schoolIds = schools.map((school) => school.id);
				expect(schoolIds).toEqual([entities[1].id]);
			});
		});

		describe('when order option is given', () => {
			const setup = async () => {
				const entity1 = schoolEntityFactory.build({ name: 'bbb' });
				const entity2 = schoolEntityFactory.build({ name: 'aaa' });
				const entity3 = schoolEntityFactory.build({ name: 'ccc' });
				await em.persistAndFlush([entity1, entity2, entity3]);
				em.clear();

				return { entity1, entity2, entity3 };
			};

			it('should return the count of all schools and the schools in given order', async () => {
				const { entity1, entity2, entity3 } = await setup();
				const options = {
					order: {
						name: SortOrder.asc,
					},
				};

				const { schools, count } = await repo.getExternalSchools({}, 'ownSchoolId', options);

				const schoolIds = schools.map((school) => school.id);
				const expectedOrder = [entity2.id, entity1.id, entity3.id];
				expect(count).toEqual(3);
				expect(schools.length).toEqual(3);
				expect(schoolIds).toEqual(expectedOrder);
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
				const entity = schoolEntityFactory.buildWithId({ systems, county }, schoolId);
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

	describe('getSchoolsBySystemIds', () => {
		describe('when no school has systems', () => {
			const setup = async () => {
				const entities = schoolEntityFactory.buildList(2);
				await em.persistAndFlush(entities);
				em.clear();

				return { entities };
			};

			it('should return empty array', async () => {
				await setup();

				const result = await repo.getSchoolsBySystemIds([]);

				expect(result).toEqual([]);
			});
		});

		describe('when some schools have specified systems', () => {
			const setup = async () => {
				const specifiedSystem = systemEntityFactory.build();
				const otherSystem = systemEntityFactory.build();
				const schoolEntityWithSpecifiedSystem = schoolEntityFactory.build({ systems: [specifiedSystem] });
				const schoolEntityWithSpecifiedSystemAndOtherSystem = schoolEntityFactory.build({
					systems: [specifiedSystem, otherSystem],
				});
				const schoolEntityWithOtherSystem = schoolEntityFactory.build({ systems: [otherSystem] });
				const schoolEntityWithEmptySystemsArray = schoolEntityFactory.build({ systems: [] });
				const schoolEntityWithoutSystems = schoolEntityFactory.build();
				await em.persistAndFlush([
					specifiedSystem,
					otherSystem,
					schoolEntityWithSpecifiedSystem,
					schoolEntityWithSpecifiedSystemAndOtherSystem,
					schoolEntityWithOtherSystem,
					schoolEntityWithEmptySystemsArray,
					schoolEntityWithoutSystems,
				]);
				em.clear();

				const expected = [
					SchoolEntityMapper.mapToDo(schoolEntityWithSpecifiedSystem),
					SchoolEntityMapper.mapToDo(schoolEntityWithSpecifiedSystemAndOtherSystem),
				];

				return { expected, specifiedSystem };
			};

			it('should return these schools', async () => {
				const { expected, specifiedSystem } = await setup();

				const result = await repo.getSchoolsBySystemIds([specifiedSystem.id]);

				expect(result).toEqual(expected);
			});
		});
	});

	describe('save', () => {
		describe('when entity is new', () => {
			const setup = async () => {
				const federalState = federalStateEntityFactory.build();
				const currentYear = schoolYearEntityFactory.build();

				await em.persistAndFlush([federalState, currentYear]);
				em.clear();

				const entity = schoolEntityFactory.build({ federalState, currentYear });
				const schoolDo = SchoolEntityMapper.mapToDo(entity);

				return { schoolDo };
			};

			it('should save entity', async () => {
				const { schoolDo } = await setup();

				const result = await repo.save(schoolDo);

				expect(result).toEqual(schoolDo);
			});
		});

		describe('when entity is existing', () => {
			const setup = async () => {
				const entity = schoolEntityFactory.build();

				const newFederalStateEntity = federalStateEntityFactory.build();
				const newSchoolYearEntity = schoolYearEntityFactory.build();
				const newSystemEntity = systemEntityFactory.build();

				await em.persistAndFlush([entity, newFederalStateEntity, newSchoolYearEntity, newSystemEntity]);
				em.clear();

				const newCounty = countyFactory.build();
				const newFederalState = FederalStateEntityMapper.mapToDo(newFederalStateEntity);
				const newSchoolYear = SchoolYearEntityMapper.mapToDo(newSchoolYearEntity);
				const expectedProps = {
					id: entity.id,
					name: 'new name',
					officialSchoolNumber: 'new officialSchoolNumber',
					externalId: 'new externalId',
					previousExternalId: 'new previousExternalId',
					inMaintenanceSince: new Date(),
					inUserMigration: true,
					purpose: SchoolPurpose.EXPERT,
					logo: {
						dataUrl: 'new logo_dataUrl',
						name: 'new logo_name',
					},
					fileStorageType: FileStorageType.AWS_S3,
					language: LanguageType.EN,
					timezone: 'new timezone',
					permissions: {},
					enableStudentTeamCreation: true,
					federalState: newFederalState,
					features: new Set([SchoolFeature.ENABLE_LDAP_SYNC_DURING_MIGRATION]),
					currentYear: newSchoolYear,
					county: newCounty,
					systemIds: [newSystemEntity._id.toHexString()],
				};
				const newSchool = schoolFactory.build(expectedProps);

				return { newSchool, expectedProps };
			};

			it('should update entity', async () => {
				const { newSchool, expectedProps } = await setup();

				const result = await repo.save(newSchool);

				expect(result).toEqual(newSchool);

				const updatedSchool = await repo.getSchoolById(newSchool.id);
				expect(updatedSchool.getProps()).toEqual(expect.objectContaining(expectedProps));
			});
		});
	});

	describe('getSchoolByOfficialSchoolNumber', () => {
		describe('when a school with the provided official school number exists', () => {
			const setup = async () => {
				const officialSchoolNumber = '00100';
				const schoolEntity = schoolEntityFactory.build({
					officialSchoolNumber,
				});

				const otherSchoolEntity = schoolEntityFactory.build({
					officialSchoolNumber: '11011',
				});

				await em.persistAndFlush([schoolEntity, otherSchoolEntity]);
				em.clear();

				const expectedSchoolDO = SchoolEntityMapper.mapToDo(schoolEntity);

				return {
					officialSchoolNumber,
					expectedSchoolDO,
				};
			};

			it('should return the existing school', async () => {
				const { officialSchoolNumber, expectedSchoolDO } = await setup();

				const school = await repo.getSchoolByOfficialSchoolNumber(officialSchoolNumber);

				expect(school).toEqual(expectedSchoolDO);
			});
		});

		describe('when a school with the provided official school number does not exist', () => {
			it('should return null', async () => {
				const officialSchoolNumber = '00100';

				const school = await repo.getSchoolByOfficialSchoolNumber(officialSchoolNumber);

				expect(school).toBeNull();
			});
		});
	});

	describe('hasLdapSystem', () => {
		describe('when the school has an active ldap system', () => {
			const setup = async () => {
				const systems = systemEntityFactory.withLdapConfig({ active: true }).buildList(1);
				const school = schoolEntityFactory.buildWithId({ systems });

				await em.persistAndFlush([school]);
				em.clear();

				return {
					school,
				};
			};

			it('should return true', async () => {
				const { school } = await setup();

				const result = await repo.hasLdapSystem(school.id);

				expect(result).toEqual(true);
			});
		});

		describe('when the school has an inactive ldap system', () => {
			const setup = async () => {
				const systems = systemEntityFactory.withLdapConfig({ active: false }).buildList(1);
				const school = schoolEntityFactory.buildWithId({ systems });

				await em.persistAndFlush([school]);
				em.clear();

				return {
					school,
				};
			};

			it('should return false', async () => {
				const { school } = await setup();

				const result = await repo.hasLdapSystem(school.id);

				expect(result).toEqual(false);
			});
		});

		describe('when the school has no ldap system', () => {
			const setup = async () => {
				const systems = systemEntityFactory.withOauthConfig().buildList(1);
				const school = schoolEntityFactory.buildWithId({ systems });

				await em.persistAndFlush([school]);
				em.clear();

				return {
					school,
				};
			};

			it('should return false', async () => {
				const { school } = await setup();

				const result = await repo.hasLdapSystem(school.id);

				expect(result).toEqual(false);
			});
		});

		describe('when the school has no systems', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId({ systems: [] });

				await em.persistAndFlush([school]);
				em.clear();

				return {
					school,
				};
			};

			it('should return false', async () => {
				const { school } = await setup();

				const result = await repo.hasLdapSystem(school.id);

				expect(result).toEqual(false);
			});
		});

		describe('when school entity is not found', () => {
			it('should return false', async () => {
				const someId = new ObjectId().toHexString();

				const result = await repo.hasLdapSystem(someId);

				expect(result).toEqual(false);
			});
		});
	});
});
