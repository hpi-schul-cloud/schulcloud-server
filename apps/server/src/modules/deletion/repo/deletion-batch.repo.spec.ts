import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { Page } from '@shared/domain/domainobject';
import { DeletionBatchRepo } from './deletion-batch.repo';
import { DeletionBatchEntity } from './entity/deletion-batch.entity';
import { DeletionBatchDomainMapper } from './mapper/deletion-batch-domain.mapper';
import { DeletionBatch } from '../domain/do';
import { deletionBatchEntityFactory } from './entity/testing';
import { BatchStatus, DomainName } from '../domain/types';

describe(DeletionBatchRepo.name, () => {
	let module: TestingModule;
	let repo: DeletionBatchRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [DeletionBatchEntity],
				}),
			],
			providers: [DeletionBatchRepo, DeletionBatchDomainMapper],
		}).compile();

		repo = module.get(DeletionBatchRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	describe('findDeletionBatches', () => {
		it('should find deletion batches', async () => {
			const entity: DeletionBatchEntity = deletionBatchEntityFactory.buildWithId();
			await em.persist(entity).flush();

			const result = await repo.findDeletionBatches({ pagination: { skip: 0, limit: 10 } });

			expect(result).toBeInstanceOf(Page);
			expect(result.data).toHaveLength(1);
			expect(result.data[0]).toEqual(expect.objectContaining({ id: entity.id }));
		});
	});

	describe('findById', () => {
		it('should find a deletion batch by id', async () => {
			const entity: DeletionBatchEntity = deletionBatchEntityFactory.buildWithId();
			await em.persist(entity).flush();

			const result = await repo.findById(entity.id);

			expect(result).toEqual(expect.objectContaining({ id: entity.id }));
		});
	});

	describe('save', () => {
		it.each([false, true])(
			'should store status and replacement ID arrays when clearing all IDs=%s',
			async (clearIds) => {
				const entity = deletionBatchEntityFactory.buildWithId({
					status: BatchStatus.CREATED,
					targetRefIds: [new ObjectId().toHexString()],
					invalidIds: [new ObjectId().toHexString()],
					skippedIds: [new ObjectId().toHexString()],
				});
				await em.persist(entity).flush();
				em.clear();
				const domainObject = await repo.findById(entity.id);
				const ids = {
					targetRefIds: clearIds ? [] : [new ObjectId().toHexString(), new ObjectId().toHexString()],
					invalidIds: [],
					skippedIds: clearIds ? [] : [new ObjectId().toHexString()],
				};
				domainObject.updateIds(ids);
				domainObject.startDeletion();

				await repo.save(domainObject);

				const stored = await em.getCollection(DeletionBatchEntity).findOne({ _id: entity._id });
				expect(stored).toMatchObject({
					_id: entity._id,
					...ids,
					status: BatchStatus.DELETION_REQUESTED,
					name: entity.name,
					targetRefDomain: entity.targetRefDomain,
					createdAt: entity.createdAt,
				});
				expect(stored).not.toHaveProperty('domainObject');
				em.clear();
				const reloaded = await repo.findById(entity.id);
				expect(reloaded.getProps()).toMatchObject({ ...ids, status: BatchStatus.DELETION_REQUESTED });
			}
		);

		it('should flush existing and new batches together before any ORM read', async () => {
			const entity = deletionBatchEntityFactory.buildWithId({ status: BatchStatus.CREATED });
			await em.persist(entity).flush();
			em.clear();
			const updated = await repo.findById(entity.id);
			updated.startDeletion();
			const created = new DeletionBatch({
				id: new ObjectId().toHexString(),
				name: 'new batch',
				status: BatchStatus.CREATED,
				targetRefDomain: DomainName.USER,
				targetRefIds: [new ObjectId().toHexString()],
				invalidIds: [],
				skippedIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await repo.save([updated, created]);

			const collection = em.getCollection(DeletionBatchEntity);
			expect(await collection.findOne({ _id: entity._id })).toMatchObject({
				status: BatchStatus.DELETION_REQUESTED,
			});
			const stored = await collection.findOne({ _id: new ObjectId(created.id) });
			expect(stored).toMatchObject({
				name: created.name,
				status: BatchStatus.CREATED,
				targetRefIds: created.targetRefIds,
				invalidIds: [],
				skippedIds: [],
			});
			expect(stored).not.toHaveProperty('domainObject');
			em.clear();
			expect((await repo.findById(updated.id)).status).toBe(BatchStatus.DELETION_REQUESTED);
			expect((await repo.findById(created.id)).getProps()).toMatchObject(created.getProps());
		});

		it('should save a new deletion batch', async () => {
			const domainObject: DeletionBatch = new DeletionBatch({
				id: new ObjectId().toHexString(),
				name: 'test',
				status: BatchStatus.CREATED,
				targetRefDomain: DomainName.USER,
				targetRefIds: [new ObjectId().toHexString()],
				invalidIds: [],
				skippedIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await repo.save(domainObject);

			const result = await repo.findById(domainObject.id);

			expect(result).toEqual(expect.objectContaining({ id: domainObject.id }));
		});
	});

	describe('delete', () => {
		it('should delete a deletion batch', async () => {
			const entity: DeletionBatchEntity = deletionBatchEntityFactory.buildWithId();
			await em.persist(entity).flush();

			const domainObject = DeletionBatchDomainMapper.mapEntityToDo(entity);
			await repo.delete(domainObject);

			const result = await em.findOne(DeletionBatchEntity, { id: entity.id });

			expect(result).toBeNull();
		});
	});

	describe('updateStatus', () => {
		it('should flush a status-only update without changing saved ID arrays', async () => {
			const entity = deletionBatchEntityFactory.buildWithId({
				status: BatchStatus.CREATED,
				targetRefIds: [new ObjectId().toHexString(), new ObjectId().toHexString()],
				invalidIds: [new ObjectId().toHexString()],
				skippedIds: [new ObjectId().toHexString()],
			});
			await em.persist(entity).flush();
			em.clear();
			const domainObject = await repo.findById(entity.id);

			await repo.updateStatus(domainObject, BatchStatus.DELETION_REQUESTED);

			const stored = await em.getCollection(DeletionBatchEntity).findOne({ _id: entity._id });
			expect(stored).toMatchObject({
				status: BatchStatus.DELETION_REQUESTED,
				targetRefIds: entity.targetRefIds,
				invalidIds: entity.invalidIds,
				skippedIds: entity.skippedIds,
				createdAt: entity.createdAt,
			});
			expect(stored).not.toHaveProperty('domainObject');
			em.clear();
			expect((await repo.findById(entity.id)).getProps()).toMatchObject({
				status: BatchStatus.DELETION_REQUESTED,
				targetRefIds: entity.targetRefIds,
				invalidIds: entity.invalidIds,
				skippedIds: entity.skippedIds,
			});
		});

		it('should update the status of a deletion batch', async () => {
			const entity: DeletionBatchEntity = deletionBatchEntityFactory.buildWithId();
			await em.persist(entity).flush();

			const domainObject = DeletionBatchDomainMapper.mapEntityToDo(entity);
			await repo.updateStatus(domainObject, BatchStatus.DELETION_REQUESTED);

			const updatedEntity = await em.findOneOrFail(DeletionBatchEntity, { id: entity.id });

			expect(updatedEntity.status).toEqual(BatchStatus.DELETION_REQUESTED);
		});
	});
});
