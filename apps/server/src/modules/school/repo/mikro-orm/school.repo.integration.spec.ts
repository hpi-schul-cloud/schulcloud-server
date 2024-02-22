import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { SortOrder } from '@shared/domain/interface';
import { SchoolFeature, SchoolPurpose } from '@shared/domain/types';
import {
	cleanupCollections,
	federalStateFactory as federalStateEntityFactory,
	schoolEntityFactory,
	schoolYearFactory as schoolYearEntityFactory,
	systemEntityFactory,
} from '@shared/testing';
import { countyEmbeddableFactory } from '@shared/testing/factory/county.embeddable.factory';
import { MongoMemoryDatabaseModule } from '@src/infra/database';
import { FileStorageType, SCHOOL_REPO } from '../../domain';
import { federalStateFactory, schoolYearFactory } from '../../testing';
import { countyFactory } from '../../testing/county.factory';
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
				const federalState = federalStateFactory.build();
				const entity1 = schoolEntityFactory.build({ federalState });
				const entity2 = schoolEntityFactory.build();
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

				await em.persistAndFlush(entity);
				em.clear();

				// Wie kann dieser Test erfolgreich sein wenn z.B. Federalstate in der Datenbank nicht bekannt sind.
				// GetReference in mapToEntityProperties müsste doch fehlschlagen.
				const newFederalState = federalStateFactory.build();
				const newSchoolYear = schoolYearFactory.build();
				const newCounty = countyFactory.build();

				const schoolDo = SchoolEntityMapper.mapToDo(entity);
				schoolDo.getProps().name = 'new name';
				schoolDo.getProps().officialSchoolNumber = 'new officialSchoolNumber';
				schoolDo.getProps().externalId = 'new externalId';
				schoolDo.getProps().previousExternalId = 'new previousExternalId';
				schoolDo.getProps().inMaintenanceSince = new Date();
				schoolDo.getProps().inUserMigration = true;
				schoolDo.getProps().purpose = SchoolPurpose.EXPERT;
				schoolDo.getProps().logo_dataUrl = 'new logo_dataUrl';
				schoolDo.getProps().logo_name = 'new logo_name';
				schoolDo.getProps().fileStorageType = FileStorageType.AWS_S3;
				schoolDo.getProps().language = 'new language';
				schoolDo.getProps().timezone = 'new timezone';
				schoolDo.getProps().permissions = {};
				schoolDo.getProps().enableStudentTeamCreation = true;
				schoolDo.getProps().federalState = newFederalState;
				schoolDo.getProps().features = new Set([SchoolFeature.ENABLE_LDAP_SYNC_DURING_MIGRATION]);
				schoolDo.getProps().currentYear = newSchoolYear;
				schoolDo.getProps().county = newCounty;
				schoolDo.getProps().systemIds = ['1'];

				return { schoolDo };
			};

			it('should update entity', async () => {
				const { schoolDo } = await setup();

				const result = await repo.save(schoolDo);

				expect(result).toEqual(schoolDo);
			});
		});
	});
});
