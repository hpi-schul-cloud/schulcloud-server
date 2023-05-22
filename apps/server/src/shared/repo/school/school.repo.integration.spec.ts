import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ISchoolProperties, School, SchoolRolePermission, SchoolRoles, SchoolYear, System } from '@shared/domain';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { schoolFactory, systemFactory } from '@shared/testing';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { LegacyLogger } from '@src/core/logger';
import { schoolDOFactory } from '@shared/testing/factory/domainobject/school.factory';
import { InternalServerErrorException } from '@nestjs/common';
import { SchoolRepo } from '..';

describe('SchoolRepo', () => {
	let module: TestingModule;
	let repo: SchoolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				SchoolRepo,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		repo = module.get(SchoolRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(School, {});
		em.clear();
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(School);
	});

	describe('save is called', () => {
		describe('when saving only required fields', () => {
			function setupDO() {
				const domainObject: SchoolDO = new SchoolDO({
					name: 'schoolName',
				});

				return {
					domainObject,
				};
			}

			it('should save a School', async () => {
				const { domainObject } = setupDO();
				const { id, ...expected } = domainObject;
				expected.systems = [];

				const result: SchoolDO = await repo.save(domainObject);

				expect(result).toMatchObject(expected);
				expect(result.id).toBeDefined();
			});
		});
	});

	it('should create a school with embedded object', async () => {
		const schoolYear = schoolYearFactory.build();
		const school = new School({ name: 'test', schoolYear, previousExternalId: 'someId' });
		school.permissions = new SchoolRoles();
		school.permissions.teacher = new SchoolRolePermission();
		school.permissions.teacher.STUDENT_LIST = true;

		await em.persistAndFlush([school, schoolYear]);

		const storedSchoolYears = await em.find(SchoolYear, {});
		expect(storedSchoolYears).toHaveLength(1);
		expect(storedSchoolYears[0]).toEqual(schoolYear);

		const storedSchools = await em.find(School, {});
		expect(storedSchools).toHaveLength(1);

		const storedSchool = storedSchools[0];
		expect(storedSchool).toEqual(school);
		expect(storedSchool.previousExternalId).toBeDefined();
		expect(storedSchool.permissions).toBeDefined();
		expect(storedSchool.permissions?.student).toBeUndefined();
		expect(storedSchool.permissions?.teacher).toBeDefined();
		expect(storedSchool.permissions?.teacher?.STUDENT_LIST).toBe(true);
	});

	describe('findByExternalId', () => {
		it('should find school by external ID', async () => {
			const system: System = systemFactory.buildWithId();
			const schoolEntity: School = schoolFactory.build({ externalId: 'externalId' });
			schoolEntity.systems.add(system);

			await em.persistAndFlush(schoolEntity);

			const result: SchoolDO | null = await repo.findByExternalId(
				schoolEntity.externalId as string,
				schoolEntity.systems[0].id
			);

			expect(result?.externalId).toEqual(schoolEntity.externalId);
		});

		it('should return null when no school is found', async () => {
			const result: SchoolDO | null = await repo.findByExternalId(
				new ObjectId().toHexString(),
				new ObjectId().toHexString()
			);

			expect(result).toBeNull();
		});
	});

	describe('findBySchoolNumber', () => {
		it('should find school by schoolnumber', async () => {
			const schoolEntity: School = schoolFactory.build({ officialSchoolNumber: '12345' });

			await em.persistAndFlush(schoolEntity);

			const result: SchoolDO | null = await repo.findBySchoolNumber(schoolEntity.officialSchoolNumber as string);

			expect(result?.officialSchoolNumber).toEqual(schoolEntity.officialSchoolNumber);
		});

		it('should return null when no school is found', async () => {
			const result: SchoolDO | null = await repo.findBySchoolNumber('fail');

			expect(result).toBeNull();
		});

		describe('when there is more than school with the same officialSchoolNumber', () => {
			const setup = async () => {
				const officialSchoolNumber = '12345';
				const schoolEntity: School = schoolFactory.build({ officialSchoolNumber });
				const schoolEntity2: School = schoolFactory.build({ officialSchoolNumber });

				await em.persistAndFlush([schoolEntity, schoolEntity2]);

				return {
					officialSchoolNumber,
				};
			};

			it('should throw an internal server error', async () => {
				const { officialSchoolNumber } = await setup();

				const func = () => repo.findBySchoolNumber(officialSchoolNumber);

				await expect(func()).rejects.toThrow(
					new InternalServerErrorException(`Multiple schools found for officialSchoolNumber ${officialSchoolNumber}`)
				);
			});
		});
	});

	describe('mapEntityToDO is called', () => {
		it('should map school entity to school domain object', () => {
			const system: System = systemFactory.buildWithId();
			const schoolYear: SchoolYear = schoolYearFactory.buildWithId();
			const schoolEntity: School = schoolFactory.buildWithId({ systems: [system], features: [], schoolYear });

			const schoolDO: SchoolDO = repo.mapEntityToDO(schoolEntity);

			expect(schoolDO).toEqual(
				expect.objectContaining({
					id: schoolEntity.id,
					externalId: schoolEntity.externalId,
					name: schoolEntity.name,
					systems: [system.id],
					features: [],
					inMaintenanceSince: schoolEntity.inMaintenanceSince,
					inUserMigration: schoolEntity.inUserMigration,
					oauthMigrationStart: schoolEntity.oauthMigrationStart,
					oauthMigrationMandatory: schoolEntity.oauthMigrationMandatory,
					oauthMigrationPossible: schoolEntity.oauthMigrationPossible,
					oauthMigrationFinished: schoolEntity.oauthMigrationFinished,
					oauthMigrationFinalFinish: schoolEntity.oauthMigrationFinalFinish,
					previousExternalId: schoolEntity.previousExternalId,
					officialSchoolNumber: schoolEntity.officialSchoolNumber,
					schoolYear,
				})
			);
		});

		it('should return an empty array for systems when entity systems is not initialized', () => {
			const schoolEntity: School = schoolFactory.buildWithId({ systems: undefined });

			const schoolDO = repo.mapEntityToDO(schoolEntity);

			expect(schoolDO.systems).toEqual([]);
		});
	});

	describe('mapDOToEntityProperties is called', () => {
		it('should map SchoolDO properties to ISchoolProperties', async () => {
			const system1: System = systemFactory.buildWithId();
			const system2: System = systemFactory.buildWithId();
			await em.persistAndFlush([system1, system2]);
			const entityDO: SchoolDO = schoolDOFactory.build({ systems: [system1.id, system2.id] });
			const emGetReferenceSpy = jest.spyOn(em, 'getReference');

			const result: ISchoolProperties = repo.mapDOToEntityProperties(entityDO);

			expect(result.externalId).toEqual(entityDO.externalId);
			expect(result.features).toEqual(entityDO.features);
			expect(result.inMaintenanceSince).toEqual(entityDO.inMaintenanceSince);
			expect(result.inUserMigration).toEqual(entityDO.inUserMigration);
			expect(result.name).toEqual(entityDO.name);
			expect(result.oauthMigrationStart).toEqual(entityDO.oauthMigrationStart);
			expect(result.oauthMigrationMandatory).toEqual(entityDO.oauthMigrationMandatory);
			expect(result.oauthMigrationPossible).toEqual(entityDO.oauthMigrationPossible);
			expect(result.oauthMigrationFinished).toEqual(entityDO.oauthMigrationFinished);
			expect(result.oauthMigrationFinalFinish).toEqual(entityDO.oauthMigrationFinalFinish);
			expect(result.previousExternalId).toEqual(entityDO.previousExternalId);
			expect(result.officialSchoolNumber).toEqual(entityDO.officialSchoolNumber);
			expect(result.schoolYear).toEqual(entityDO.schoolYear);

			expect(emGetReferenceSpy).toHaveBeenCalledTimes(2);
			expect(emGetReferenceSpy).toHaveBeenNthCalledWith(1, System, system1.id);
			expect(emGetReferenceSpy).toHaveBeenNthCalledWith(2, System, system2.id);
		});

		describe('when there are no systems', () => {
			it('should not call the entity manager to get the system object', () => {
				const entityDO: SchoolDO = schoolDOFactory.build({ systems: undefined });
				const emGetReferenceSpy = jest.spyOn(em, 'getReference');

				repo.mapDOToEntityProperties(entityDO);

				expect(emGetReferenceSpy).not.toHaveBeenCalled();
			});
		});
	});
});
