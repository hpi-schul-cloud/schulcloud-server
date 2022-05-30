import { EntityManager } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { School, SchoolRolePermission, SchoolRoles } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { SchoolRepo } from '..';

describe('school repo', () => {
	let module: TestingModule;
	let repo: SchoolRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SchoolRepo],
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
		const school = new School({ name: 'test' });
		school.permissions = new SchoolRoles();
		school.permissions.teacher = new SchoolRolePermission();
		school.permissions.teacher.STUDENT_LIST = true;
		await repo.save(school);
		em.clear();
		const storedSchools = await em.find(School, {});
		expect(storedSchools).toHaveLength(1);
		const storedSchool = storedSchools[0];
		expect(storedSchool).toEqual(school);
		expect(storedSchool.permissions).toBeDefined();
		expect(storedSchool.permissions?.student).toBeUndefined();
		expect(storedSchool.permissions?.teacher).toBeDefined();
		expect(storedSchool.permissions?.teacher?.STUDENT_LIST).toBe(true);
	});
});
