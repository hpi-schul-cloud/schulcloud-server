import { createMock } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ISchoolProperties,
	LegacySchoolDo,
	SchoolEntity,
	SchoolRolePermission,
	SchoolRoles,
	SchoolYear,
	SystemEntity,
	UserLoginMigration,
} from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	legacySchoolDoFactory,
	schoolFactory,
	schoolYearFactory,
	systemFactory,
	userLoginMigrationFactory,
} from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { LegacySchoolRepo } from '..';

describe('LegacySchoolRepo', () => {
	let module: TestingModule;
	let repo: LegacySchoolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				LegacySchoolRepo,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		repo = module.get(LegacySchoolRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(SchoolEntity, {});
		await em.nativeDelete(SchoolYear, {});
		em.clear();
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(SchoolEntity);
	});

	describe('save is called', () => {
		describe('when saving only required fields', () => {
			function setupDO() {
				const domainObject: LegacySchoolDo = legacySchoolDoFactory.build();
				return {
					domainObject,
				};
			}

			it('should save a School', async () => {
				const { domainObject } = setupDO();
				const { id, ...expected } = domainObject;
				expected.systems = [];

				const result: LegacySchoolDo = await repo.save(domainObject);

				expect(result).toMatchObject(expected);
				expect(result.id).toBeDefined();
			});
		});
	});

	it('should create a school with embedded object', async () => {
		const schoolYear = schoolYearFactory.build();
		const school = schoolFactory.build({
			name: 'test',
			schoolYear,
			previousExternalId: 'someId',
			userLoginMigration: userLoginMigrationFactory.build(),
		});
		school.permissions = new SchoolRoles();
		school.permissions.teacher = new SchoolRolePermission();
		school.permissions.teacher.STUDENT_LIST = true;

		await em.persistAndFlush([school]);

		const storedSchoolYears = await em.find(SchoolYear, {});
		expect(storedSchoolYears).toHaveLength(1);
		expect(storedSchoolYears[0]).toEqual(schoolYear);

		const storedSchools = await em.find(SchoolEntity, {});
		expect(storedSchools).toHaveLength(1);

		const storedSchool = storedSchools[0];
		expect(storedSchool).toEqual(school);
		expect(storedSchool.previousExternalId).toBeDefined();
		expect(storedSchool.permissions).toBeDefined();
		expect(storedSchool.permissions?.student).toBeUndefined();
		expect(storedSchool.permissions?.teacher).toBeDefined();
		expect(storedSchool.permissions?.teacher?.STUDENT_LIST).toBe(true);
		expect(storedSchool.userLoginMigration).toBeDefined();
	});

	describe('findByExternalId', () => {
		it('should find school by external ID', async () => {
			const system: SystemEntity = systemFactory.buildWithId();
			const schoolEntity: SchoolEntity = schoolFactory.build({ externalId: 'externalId' });
			schoolEntity.systems.add(system);

			await em.persistAndFlush(schoolEntity);

			const result: LegacySchoolDo | null = await repo.findByExternalId(
				schoolEntity.externalId as string,
				schoolEntity.systems[0].id
			);

			expect(result?.externalId).toEqual(schoolEntity.externalId);
		});

		it('should return null when no school is found', async () => {
			const result: LegacySchoolDo | null = await repo.findByExternalId(
				new ObjectId().toHexString(),
				new ObjectId().toHexString()
			);

			expect(result).toBeNull();
		});
	});

	describe('findBySchoolNumber', () => {
		it('should find school by schoolnumber', async () => {
			const schoolEntity: SchoolEntity = schoolFactory.build({ officialSchoolNumber: '12345' });

			await em.persistAndFlush(schoolEntity);

			const result: LegacySchoolDo | null = await repo.findBySchoolNumber(schoolEntity.officialSchoolNumber as string);

			expect(result?.officialSchoolNumber).toEqual(schoolEntity.officialSchoolNumber);
		});

		it('should return null when no school is found', async () => {
			const result: LegacySchoolDo | null = await repo.findBySchoolNumber('fail');

			expect(result).toBeNull();
		});

		describe('when there is more than school with the same officialSchoolNumber', () => {
			const setup = async () => {
				const officialSchoolNumber = '12345';
				const schoolEntity: SchoolEntity = schoolFactory.build({ officialSchoolNumber });
				const schoolEntity2: SchoolEntity = schoolFactory.build({ officialSchoolNumber });

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
			const system: SystemEntity = systemFactory.buildWithId();
			const schoolYear: SchoolYear = schoolYearFactory.buildWithId();
			const schoolEntity: SchoolEntity = schoolFactory.buildWithId({ systems: [system], features: [], schoolYear });
			const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.build({ school: schoolEntity });
			schoolEntity.userLoginMigration = userLoginMigration;

			const schoolDO: LegacySchoolDo = repo.mapEntityToDO(schoolEntity);

			expect(schoolDO).toEqual(
				expect.objectContaining({
					id: schoolEntity.id,
					externalId: schoolEntity.externalId,
					name: schoolEntity.name,
					systems: [system.id],
					features: [],
					inMaintenanceSince: schoolEntity.inMaintenanceSince,
					inUserMigration: schoolEntity.inUserMigration,
					previousExternalId: schoolEntity.previousExternalId,
					officialSchoolNumber: schoolEntity.officialSchoolNumber,
					schoolYear,
					userLoginMigrationId: userLoginMigration.id,
					federalState: schoolEntity.federalState,
				})
			);
		});

		it('should return an empty array for systems when entity systems is not initialized', () => {
			const schoolEntity: SchoolEntity = schoolFactory.buildWithId({ systems: undefined });

			const schoolDO = repo.mapEntityToDO(schoolEntity);

			expect(schoolDO.systems).toEqual([]);
		});
	});

	describe('mapDOToEntityProperties is called', () => {
		const setup = async () => {
			const system1: SystemEntity = systemFactory.buildWithId();
			const system2: SystemEntity = systemFactory.buildWithId();

			const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId();

			await em.persistAndFlush([userLoginMigration, system1, system2]);

			const entityDO: LegacySchoolDo = legacySchoolDoFactory.build({
				systems: [system1.id, system2.id],
				userLoginMigrationId: userLoginMigration.id,
			});
			const emGetReferenceSpy = jest.spyOn(em, 'getReference');

			return {
				entityDO,
				emGetReferenceSpy,
				system1,
				system2,
				userLoginMigration,
			};
		};

		it('should map SchoolDO properties to ISchoolProperties', async () => {
			const { entityDO, emGetReferenceSpy, system1, system2, userLoginMigration } = await setup();

			const result: ISchoolProperties = repo.mapDOToEntityProperties(entityDO);

			expect(result.externalId).toEqual(entityDO.externalId);
			expect(result.features).toEqual(entityDO.features);
			expect(result.inMaintenanceSince).toEqual(entityDO.inMaintenanceSince);
			expect(result.inUserMigration).toEqual(entityDO.inUserMigration);
			expect(result.name).toEqual(entityDO.name);
			expect(result.previousExternalId).toEqual(entityDO.previousExternalId);
			expect(result.officialSchoolNumber).toEqual(entityDO.officialSchoolNumber);
			expect(result.schoolYear).toEqual(entityDO.schoolYear);
			expect(result.userLoginMigration?.id).toEqual(entityDO.userLoginMigrationId);
			expect(result.federalState).toEqual(entityDO.federalState);

			expect(emGetReferenceSpy).toHaveBeenCalledTimes(3);
			expect(emGetReferenceSpy).toHaveBeenNthCalledWith(1, SystemEntity, system1.id);
			expect(emGetReferenceSpy).toHaveBeenNthCalledWith(2, SystemEntity, system2.id);
			expect(emGetReferenceSpy).toHaveBeenNthCalledWith(3, UserLoginMigration, userLoginMigration.id);
		});

		describe('when there are no systems', () => {
			it('should not call the entity manager to get the system object', () => {
				const entityDO: LegacySchoolDo = legacySchoolDoFactory.build({ systems: undefined });
				const emGetReferenceSpy = jest.spyOn(em, 'getReference');

				repo.mapDOToEntityProperties(entityDO);

				expect(emGetReferenceSpy).not.toHaveBeenCalled();
			});
		});

		describe('when there is no userLoginMigration', () => {
			it('should not call the entity manager to get the user login migration reference', () => {
				const entityDO: LegacySchoolDo = legacySchoolDoFactory.build({ userLoginMigrationId: undefined });
				const emGetReferenceSpy = jest.spyOn(em, 'getReference');

				repo.mapDOToEntityProperties(entityDO);

				expect(emGetReferenceSpy).not.toHaveBeenCalled();
			});
		});
	});
});
