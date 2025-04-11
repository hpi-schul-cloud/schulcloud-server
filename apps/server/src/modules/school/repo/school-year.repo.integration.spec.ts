import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { schoolYearEntityFactory } from '../testing';
import { SchoolYearEntityMapper } from './mapper';
import { SchoolYearEntity } from './school-year.entity';
import { SchoolYearMikroOrmRepo } from './school-year.repo';

describe('schoolyear repo', () => {
	let module: TestingModule;
	let repo: SchoolYearMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [SchoolYearEntity] })],
			providers: [SchoolYearMikroOrmRepo],
		}).compile();
		repo = module.get(SchoolYearMikroOrmRepo);
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
		const schoolYear = schoolYearEntityFactory.build();
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

					const schoolYear: SchoolYearEntity = schoolYearEntityFactory.build({
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

					const schoolYear: SchoolYearEntity = schoolYearEntityFactory.build({
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

				const schoolYear: SchoolYearEntity = schoolYearEntityFactory.build({
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

	describe('findCurrentOrNextYear', () => {
		describe('when current date is within a schoolyear', () => {
			const setup = async () => {
				jest
					.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] })
					.setSystemTime(new Date('2021-01-01'));

				const previousYear: SchoolYearEntity = schoolYearEntityFactory.build({
					startDate: new Date('2019-09-01'),
					endDate: new Date('2020-07-31'),
				});

				const currentYear: SchoolYearEntity = schoolYearEntityFactory.build({
					startDate: new Date('2020-09-01'),
					endDate: new Date('2021-07-31'),
				});

				const nextYear: SchoolYearEntity = schoolYearEntityFactory.build({
					startDate: new Date('2021-09-01'),
					endDate: new Date('2022-07-31'),
				});

				await em.persistAndFlush([previousYear, currentYear, nextYear]);
				em.clear();

				return { previousYear, currentYear, nextYear };
			};

			it('should return the current schoolyear', async () => {
				const { currentYear } = await setup();

				const result = await repo.findCurrentOrNextYear();

				expect(result).toEqual(currentYear);
			});
		});

		describe('when current date is during a summerbreak', () => {
			const setup = async () => {
				jest
					.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] })
					.setSystemTime(new Date('2020-08-31'));

				const previousYear: SchoolYearEntity = schoolYearEntityFactory.build({
					startDate: new Date('2019-09-01'),
					endDate: new Date('2020-07-31'),
				});

				const nextYear: SchoolYearEntity = schoolYearEntityFactory.build({
					startDate: new Date('2020-09-01'),
					endDate: new Date('2021-07-31'),
				});

				await em.persistAndFlush([previousYear, nextYear]);
				em.clear();

				return { previousYear, nextYear };
			};

			it('should return the upcoming schoolyear', async () => {
				const { nextYear } = await setup();

				const result = await repo.findCurrentOrNextYear();

				expect(result).toEqual(nextYear);
			});
		});

		describe('when current date is later than any year', () => {
			const setup = async () => {
				jest
					.useFakeTimers({ advanceTimers: true, doNotFake: ['setInterval', 'clearInterval', 'setTimeout'] })
					.setSystemTime(new Date('2030-08-31'));

				const previousYear: SchoolYearEntity = schoolYearEntityFactory.build({
					startDate: new Date('2019-09-01'),
					endDate: new Date('2020-07-31'),
				});

				const nextYear: SchoolYearEntity = schoolYearEntityFactory.build({
					startDate: new Date('2020-09-01'),
					endDate: new Date('2021-07-31'),
				});

				await em.persistAndFlush([previousYear, nextYear]);
				em.clear();

				return { previousYear, nextYear };
			};

			it('should throw', async () => {
				await setup();

				const func = () => repo.findCurrentOrNextYear();

				await expect(func).rejects.toThrow();
			});
		});
	});

	describe('getAllSchoolYears', () => {
		const setup = async () => {
			const entities = schoolYearEntityFactory.buildList(3);
			await em.persistAndFlush(entities);
			em.clear();
			const schools = entities.map((entity) => SchoolYearEntityMapper.mapToDo(entity));

			return { schools };
		};

		it('should return all school years', async () => {
			const { schools } = await setup();

			const result = await repo.getAllSchoolYears();

			expect(result).toEqual(schools);
		});
	});
});
