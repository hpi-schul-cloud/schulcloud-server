import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { School, SchoolRolePermission, SchoolRoles, SchoolYear, System } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { schoolFactory, systemFactory } from '@shared/testing';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { createMock } from '@golevelup/ts-jest';
import { SchoolRepo } from '..';
import { SchoolDO } from '../../domain/domainobject/school.do';
import { Logger } from '../../../core/logger';
import { SchoolMapper } from '../../../modules/school/mapper/school.mapper';

describe('SchoolRepo', () => {
	let module: TestingModule;
	let repo: SchoolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				SchoolRepo,
				SchoolMapper,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		repo = module.get(SchoolRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(School, {});
		em.clear();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(School);
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
	});
});
