import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { CourseSynchronizationHistory } from '../../domain';
import { courseSynchronizationHistoryEntityFactory, courseSynchronizationHistoryFactory } from '../../testing';
import { COURSE_SYNCHRONIZATION_HISTORY_REPO } from '../../domain';
import { CourseSynchronizationHistoryEntity } from '../entity';
import { CourseSynchronizationHistoryMapper } from '../mapper';
import { CourseSynchronizationHistoryMirkoOrmRepo } from './course-synchronization-history.repo';

describe(CourseSynchronizationHistoryMirkoOrmRepo.name, () => {
	let module: TestingModule;
	let repo: CourseSynchronizationHistoryMirkoOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [CourseSynchronizationHistoryEntity] })],
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

	describe('saveAll', () => {
		describe('when a list of course sync history DOs is passed', () => {
			const setup = () => {
				const expectedSavedEntities = courseSynchronizationHistoryEntityFactory.buildList(3);

				const historyDOs = expectedSavedEntities.map((entity: CourseSynchronizationHistoryEntity) =>
					courseSynchronizationHistoryFactory.build({
						id: entity.id,
						externalGroupId: entity.externalGroupId,
						synchronizedCourse: entity.synchronizedCourse.toHexString(),
						expiresAt: entity.expiresAt,
						excludeFromSync: entity.excludeFromSync,
					})
				);

				return { historyDOs, expectedSavedEntities };
			};

			it('should save all the course sync histories', async () => {
				const { historyDOs, expectedSavedEntities } = setup();

				await repo.saveAll(historyDOs);

				for (const expectedEntity of expectedSavedEntities) {
					const savedEntity = await em.findOneOrFail(CourseSynchronizationHistoryEntity, expectedEntity.id);

					expect(savedEntity).toEqual<CourseSynchronizationHistoryEntity>({
						...expectedEntity,
						createdAt: expect.any(Date) as unknown as Date,
						updatedAt: expect.any(Date) as unknown as Date,
					});
					expect(savedEntity.synchronizedCourse.id).toEqual(expectedEntity.synchronizedCourse.id);
				}
			});

			it('should return a list of the saved course sync histories', async () => {
				const { historyDOs } = setup();

				const result = await repo.saveAll(historyDOs);

				historyDOs.forEach((expectedDO: CourseSynchronizationHistory) => {
					const resultDO = result.find((historyDO: CourseSynchronizationHistory) => historyDO.id === expectedDO.id);
					expect(resultDO).toEqual(expectedDO);
				});
			});
		});
	});

	describe('findByExternalGroupId', () => {
		describe('when histories with the passed external group id exist', () => {
			const setup = async () => {
				const externalGroupId = 'test-external-group-id';

				const historyEntities = courseSynchronizationHistoryEntityFactory.buildList(3, {
					externalGroupId,
				});
				const otherHistoryEntity = courseSynchronizationHistoryEntityFactory.build();

				await em.persistAndFlush([...historyEntities, otherHistoryEntity]);

				const expectedDOs = historyEntities.map((entity: CourseSynchronizationHistoryEntity) =>
					CourseSynchronizationHistoryMapper.mapEntityToDO(entity)
				);

				return { externalGroupId, expectedDOs };
			};

			it('should return the found course sync history', async () => {
				const { externalGroupId, expectedDOs } = await setup();

				const result = await repo.findByExternalGroupId(externalGroupId);

				expect(result.length).toEqual(expectedDOs.length);
				expect(result).toEqual(expect.arrayContaining(expectedDOs));
			});
		});

		describe('when there is no history with the passed external group id', () => {
			const setup = async () => {
				const otherHistoryEntity = courseSynchronizationHistoryEntityFactory.build();

				await em.persistAndFlush([otherHistoryEntity]);

				return { externalGroupId: 'test-external-group-id' };
			};

			it('should return an empty array', async () => {
				const { externalGroupId } = await setup();

				const result = await repo.findByExternalGroupId(externalGroupId);

				expect(result.length).toEqual(0);
			});
		});
	});

	describe('delete', () => {
		describe('when a list of course sync histories is passed', () => {
			const setup = async () => {
				const syncHistoryEntities = courseSynchronizationHistoryEntityFactory.buildList(3);
				const otherEntities = courseSynchronizationHistoryEntityFactory.buildList(3);

				await em.persistAndFlush([...syncHistoryEntities, ...otherEntities]);
				em.clear();

				const syncHistoryDOs = syncHistoryEntities.map((entity: CourseSynchronizationHistoryEntity) =>
					courseSynchronizationHistoryFactory.build({
						id: entity.id,
						externalGroupId: entity.externalGroupId,
						synchronizedCourse: entity.synchronizedCourse.toHexString(),
						expiresAt: entity.expiresAt,
						excludeFromSync: entity.excludeFromSync,
					})
				);

				const syncHistoryIds = syncHistoryEntities.map(
					(entity: CourseSynchronizationHistoryEntity) => new ObjectId(entity.id)
				);

				return { syncHistoryDOs, syncHistoryIds };
			};

			it('should delete the passed course sync histories', async () => {
				const { syncHistoryDOs, syncHistoryIds } = await setup();

				await repo.delete(syncHistoryDOs);

				const foundEntities = await em.find(CourseSynchronizationHistoryEntity, { _id: { $in: syncHistoryIds } });

				expect(foundEntities.length).toEqual(0);
			});
		});

		describe('when a single course sync history is passed', () => {
			const setup = async () => {
				const syncHistoryEntity = courseSynchronizationHistoryEntityFactory.build();
				const otherEntities = courseSynchronizationHistoryEntityFactory.buildList(3);

				await em.persistAndFlush([syncHistoryEntity, ...otherEntities]);
				em.clear();

				const syncHistoryDO = courseSynchronizationHistoryFactory.build({
					id: syncHistoryEntity.id,
					externalGroupId: syncHistoryEntity.externalGroupId,
					synchronizedCourse: syncHistoryEntity.synchronizedCourse.toHexString(),
					expiresAt: syncHistoryEntity.expiresAt,
					excludeFromSync: syncHistoryEntity.excludeFromSync,
				});

				return { syncHistoryDO };
			};

			it('should delete the passed course sync history', async () => {
				const { syncHistoryDO } = await setup();

				await repo.delete(syncHistoryDO);

				const foundEntity = await em.findOne(CourseSynchronizationHistoryEntity, syncHistoryDO.id);

				expect(foundEntity).toEqual(null);
			});
		});
	});
});
