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

	describe('findCurrentYear', () => {
		describe('when date is between schoolyears start and end date', () => {
			const setup = async () => {
				const schoolYear: SchoolYear = schoolYearFactory.build({
					startDate: new Date('2020-08-01'),
					endDate: new Date('9999-07-31'),
				});

				await em.persistAndFlush(schoolYear);
				em.clear();

				return { schoolYear };
			};

			it('should return the current schoolyear', async () => {
				const { schoolYear } = await setup();

				const currentYear = await repo.findCurrentYear();

				expect(currentYear).toEqual(schoolYear);
			});
		});

		describe('when date is not between schoolyears start and end date', () => {
			const setup = async () => {
				const schoolYear: SchoolYear = schoolYearFactory.build({
					startDate: new Date('2020-08-01'),
					endDate: new Date('2021-07-31'),
				});

				await em.persistAndFlush(schoolYear);
				em.clear();

				return { schoolYear };
			};

			it('should return the current schoolyear', async () => {
				await setup();

				const func = () => repo.findCurrentYear();

				await expect(func).rejects.toThrow();
			});
		});
	});
});
