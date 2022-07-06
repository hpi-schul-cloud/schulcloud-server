import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { School, SchoolRolePermission, SchoolRoles, SchoolYear } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { schoolFactory } from '@shared/testing';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { SchoolRepo } from '..';
import { SchoolYearRepo } from '../schoolyear';

describe('school repo', () => {
	let module: TestingModule;
	let repo: SchoolRepo;
	let schoolYearRepo: SchoolYearRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SchoolRepo, SchoolYearRepo],
		}).compile();
		repo = module.get(SchoolRepo);
		schoolYearRepo = module.get(SchoolYearRepo);
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
		const school = new School({ name: 'test', schoolYear });
		school.permissions = new SchoolRoles();
		school.permissions.teacher = new SchoolRolePermission();
		school.permissions.teacher.STUDENT_LIST = true;
		await em.persistAndFlush([school, schoolYear]);
		em.clear();
		const storedSchoolYears = await em.find(SchoolYear, {});
		expect(storedSchoolYears).toHaveLength(1);
		expect(storedSchoolYears[0]).toEqual(schoolYear);
		const storedSchools = await em.find(School, {});
		expect(storedSchools).toHaveLength(1);
		const storedSchool = storedSchools[0];
		expect(storedSchool).toEqual(school);
		expect(storedSchool.permissions).toBeDefined();
		expect(storedSchool.permissions?.student).toBeUndefined();
		expect(storedSchool.permissions?.teacher).toBeDefined();
		expect(storedSchool.permissions?.teacher?.STUDENT_LIST).toBe(true);
	});

	it('createAndSave', async () => {
		// Arrange
		const schoolEntity: School = schoolFactory.build();

		// Act
		const savedSchool: School = await repo.createAndSave(schoolEntity);

		// Assert
		const savedSchoolEntity = await em.find(School, {});
		expect(savedSchoolEntity[0].id).toBeDefined();
		expect(savedSchool).toEqual(savedSchoolEntity[0]);
	});
});
