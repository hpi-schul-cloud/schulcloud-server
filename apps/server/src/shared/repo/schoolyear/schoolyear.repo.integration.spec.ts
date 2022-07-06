import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolYear } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { cleanupCollections } from '@shared/testing';
import { schoolYearFactory } from '@shared/testing/factory/schoolyear.factory';
import { SchoolYearRepo } from './schoolyear.repo';

describe('schoolyear repo', () => {
	let module: TestingModule;
	let repo: SchoolYearRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SchoolYearRepo],
		}).compile();
		repo = module.get(SchoolYearRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(SchoolYear);
	});

	it('should create a schoolyear', async () => {
		const schoolYear = schoolYearFactory.build();
		await repo.save(schoolYear);
		em.clear();
		const storedSchoolYears = await em.find(SchoolYear, {});
		expect(storedSchoolYears).toHaveLength(1);
		const storedSchoolYear = storedSchoolYears[0];
		expect(storedSchoolYear).toEqual(schoolYear);
		expect(storedSchoolYear.name).toBeDefined();
		expect(storedSchoolYear.startDate).toBeDefined();
		expect(storedSchoolYear.endDate).toBeDefined();
	});
});
