import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolYearEntity } from '@shared/domain/entity';
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
		expect(repo.entityName).toBe(SchoolYearEntity);
	});

	it('should create a schoolyear', async () => {
		const schoolYear = schoolYearFactory.build();
		await repo.save(schoolYear);
		em.clear();
		const storedSchoolYears = await em.find(SchoolYearEntity, {});
		expect(storedSchoolYears).toHaveLength(1);
		const storedSchoolYear = storedSchoolYears[0];
		expect(storedSchoolYear).toEqual(schoolYear);
		expect(storedSchoolYear.name).toBeDefined();
		expect(storedSchoolYear.startDate).toBeDefined();
		expect(storedSchoolYear.endDate).toBeDefined();
	});

	describe('findCurrentYear', () => {
		describe('when current date is between schoolyears start and end date', () => {
			describe('when current date year is in the schoolyears start date', () => {
				const setup = async () => {
					jest
						.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] })
						.setSystemTime(new Date('2023-10-01'));

					const schoolYear: SchoolYearEntity = schoolYearFactory.build({
						startDate: new Date('2023-08-01'),
						endDate: new Date('2024-07-31'),
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
			describe('when current date year is in the schoolyears end date', () => {
				const setup = async () => {
					jest
						.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] })
						.setSystemTime(new Date('2024-03-01'));

					const schoolYear: SchoolYearEntity = schoolYearFactory.build({
						startDate: new Date('2023-08-01'),
						endDate: new Date('2024-07-31'),
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
		});

		describe('when current date is outside schoolyears start and end date', () => {
			const setup = async () => {
				jest
					.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] })
					.setSystemTime(new Date('2024-01-01'));

				const schoolYear: SchoolYearEntity = schoolYearFactory.build({
					startDate: new Date('2020-08-01'),
					endDate: new Date('2021-07-31'),
				});

				await em.persistAndFlush(schoolYear);
				em.clear();

				return { schoolYear };
			};

			it('should throw', async () => {
				await setup();

				const func = () => repo.findCurrentYear();

				await expect(func).rejects.toThrow();
			});
		});
	});
});
