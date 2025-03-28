import { EntityManager } from '@mikro-orm/mongodb';
import { CourseEntity } from '@modules/course/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { CourseSynchronizationHistory } from '../../do';
import { courseSynchronizationHistoryEntityFactory, courseSynchronizationHistoryFactory } from '../../testing';
import { COURSE_SYNCHRONIZATION_HISTORY_REPO } from '../course-synchronization-history.repo.interface';
import { CourseSynchronizationHistoryEntity } from '../entity';
import { CourseSynchronizationHistoryMapper } from '../mapper';
import { CourseSynchronizationHistoryMirkoOrmRepo } from './course-synchronization-history.repo';

describe(CourseSynchronizationHistoryMirkoOrmRepo.name, () => {
	let module: TestingModule;
	let repo: CourseSynchronizationHistoryMirkoOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [CourseSynchronizationHistoryEntity, CourseEntity] })],
			providers: [{ provide: COURSE_SYNCHRONIZATION_HISTORY_REPO, useClass: CourseSynchronizationHistoryMirkoOrmRepo }],
		}).compile();

		repo = module.get(COURSE_SYNCHRONIZATION_HISTORY_REPO);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('save', () => {
		describe('when a course synchronization history do is passed', () => {
			const setup = async () => {
				const expectedSavedEntity = courseSynchronizationHistoryEntityFactory.build();

				const syncedCourseEntity = expectedSavedEntity.synchronizedCourse;

				await em.persistAndFlush([syncedCourseEntity]);
				em.clear();

				const historyDO = courseSynchronizationHistoryFactory.build({
					id: expectedSavedEntity.id,
					externalGroupId: expectedSavedEntity.externalGroupId,
					synchronizedCourse: syncedCourseEntity.id,
					expirationDate: expectedSavedEntity.expirationDate,
				});

				return { historyDO, expectedSavedEntity };
			};

			it('should save the course synchronization history', async () => {
				const { historyDO, expectedSavedEntity } = await setup();

				await repo.save(historyDO);

				const savedEntity = await em.findOneOrFail(CourseSynchronizationHistoryEntity, expectedSavedEntity.id);

				expect(savedEntity).toEqual<CourseSynchronizationHistoryEntity>({
					...expectedSavedEntity,
					createdAt: expect.any(Date) as unknown as Date,
					updatedAt: expect.any(Date) as unknown as Date,
					synchronizedCourse: expect.any(CourseEntity),
				});
				expect(savedEntity.synchronizedCourse.id).toEqual(expectedSavedEntity.synchronizedCourse.id);
			});

			it('should return the saved course synchronization history', async () => {
				const { historyDO, expectedSavedEntity } = await setup();

				const result = await repo.save(historyDO);

				expect(result).toEqual<CourseSynchronizationHistoryEntity>({
					...expectedSavedEntity,
					synchronizedCourse: expect.objectContaining({
						id: expectedSavedEntity.synchronizedCourse.id,
					}),
				});
			});
		});
	});

	describe('saveAll', () => {
		describe('when a list of course synchronization history DOs is passed', () => {
			const setup = async () => {
				const expectedSavedEntities = courseSynchronizationHistoryEntityFactory.buildList(3);

				const syncedCourseEntities = expectedSavedEntities.map(
					(entity: CourseSynchronizationHistoryEntity) => entity.synchronizedCourse
				);

				await em.persistAndFlush(syncedCourseEntities);
				em.clear();

				const historyDOs = expectedSavedEntities.map((entity: CourseSynchronizationHistoryEntity) =>
					courseSynchronizationHistoryFactory.build({
						id: entity.id,
						externalGroupId: entity.externalGroupId,
						synchronizedCourse: entity.synchronizedCourse.id,
						expirationDate: entity.expirationDate,
					})
				);

				return { historyDOs, expectedSavedEntities };
			};

			it('should save all the course synchronization histories', async () => {
				const { historyDOs, expectedSavedEntities } = await setup();

				await repo.saveAll(historyDOs);

				for (const expectedEntity of expectedSavedEntities) {
					const savedEntity = await em.findOneOrFail(CourseSynchronizationHistoryEntity, expectedEntity.id);
					expect(savedEntity.externalGroupId).toEqual(expectedEntity.externalGroupId);
					expect(savedEntity.expirationDate).toEqual(expectedEntity.expirationDate);
					expect(savedEntity.synchronizedCourse.id).toEqual(expectedEntity.synchronizedCourse.id);
				}
			});

			it('should return a list of the saved course synchronization histories', async () => {
				const { historyDOs, expectedSavedEntities } = await setup();

				const result = await repo.saveAll(historyDOs);

				expectedSavedEntities.forEach((expectedEntity: CourseSynchronizationHistoryEntity) => {
					const resultDO = result.find((historyDO: CourseSynchronizationHistory) => historyDO.id === expectedEntity.id);

					expect(resultDO).not.toBeUndefined();
					expect(resultDO?.externalGroupId).toEqual(expectedEntity.externalGroupId);
					expect(resultDO?.expirationDate).toEqual(expectedEntity.expirationDate);
					expect(resultDO?.synchronizedCourse).toEqual(expectedEntity.synchronizedCourse.id);
				});
			});
		});
	});

	describe('findByExternalGroupId', () => {
		describe('when a history with the passed external group id exists', () => {
			const setup = async () => {
				const historyEntity = courseSynchronizationHistoryEntityFactory.build();
				const otherHistoryEntity = courseSynchronizationHistoryEntityFactory.build();

				await em.persistAndFlush([historyEntity, otherHistoryEntity]);

				const expectedDO = CourseSynchronizationHistoryMapper.mapEntityToDO(historyEntity);

				return { externalGroupId: historyEntity.externalGroupId, expectedDO };
			};

			it('should return the found course synchronization history', async () => {
				const { externalGroupId, expectedDO } = await setup();

				const result = await repo.findByExternalGroupId(externalGroupId);

				expect(result).toEqual(expectedDO);
			});
		});

		describe('when there is no history with the passed external group id', () => {
			const setup = async () => {
				const otherHistoryEntity = courseSynchronizationHistoryEntityFactory.build();

				await em.persistAndFlush([otherHistoryEntity]);

				return { externalGroupId: 'test-external-group-id' };
			};

			it('should return null', async () => {
				const { externalGroupId } = await setup();

				const result = await repo.findByExternalGroupId(externalGroupId);

				expect(result).toBeNull();
			});
		});
	});
});
