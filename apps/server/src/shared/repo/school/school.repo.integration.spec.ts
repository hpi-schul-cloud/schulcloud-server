import { EntityManager, NotFoundError } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { School, SchoolRolePermission, SchoolRoles, SchoolYear, System } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { schoolFactory, systemFactory } from '@shared/testing';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolRepo } from '..';
import { SchoolYearRepo } from '../schoolyear';

describe('school repo', () => {
	let module: TestingModule;
	let repo: SchoolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SchoolRepo, SchoolYearRepo],
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
		const schoolEntity: School = schoolFactory.build();

		const createdSchool: School = repo.create(schoolEntity);
		await repo.save(createdSchool);

		const savedSchoolEntity = await em.find(School, {});
		expect(savedSchoolEntity[0].id).toBeDefined();
		expect(createdSchool.id).toBeDefined();
	});

	describe('findByExternalIdOrFail', () => {
		it('should find school by external ID', async () => {
			const system: System = systemFactory.buildWithId();
			const schoolEntity: School = schoolFactory.build({ externalId: 'externalId' });
			schoolEntity.systems.add(system);

			await em.persistAndFlush(schoolEntity);

			const result: School = await repo.findByExternalIdOrFail(
				schoolEntity.externalId as string,
				schoolEntity.systems[0].id
			);

			expect(result).toEqual(schoolEntity);
		});
		it('should throw NotFoundError when no school is found', async () => {
			await expect(
				repo.findByExternalIdOrFail(new ObjectId().toHexString(), new ObjectId().toHexString())
			).rejects.toThrow(NotFoundError);
		});
	});
});
