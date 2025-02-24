import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
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
			await em.persistAndFlush(entity);

			const result = await repo.findDeletionBatches({ pagination: { skip: 0, limit: 10 } });

			expect(result).toBeInstanceOf(Page);
			expect(result.data).toHaveLength(1);
			expect(result.data[0]).toEqual(expect.objectContaining({ id: entity.id }));
		});
	});

	describe('findById', () => {
		it('should find a deletion batch by id', async () => {
			const entity: DeletionBatchEntity = deletionBatchEntityFactory.buildWithId();
			await em.persistAndFlush(entity);

			const result = await repo.findById(entity.id);

			expect(result).toEqual(expect.objectContaining({ id: entity.id }));
		});
	});

	describe('save', () => {
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
			await em.persistAndFlush(entity);

			const domainObject = DeletionBatchDomainMapper.mapEntityToDo(entity);
			await repo.delete(domainObject);

			const result = await em.findOne(DeletionBatchEntity, { id: entity.id });

			expect(result).toBeNull();
		});
	});

	describe('updateStatus', () => {
		it('should update the status of a deletion batch', async () => {
			const entity: DeletionBatchEntity = deletionBatchEntityFactory.buildWithId();
			await em.persistAndFlush(entity);

			const domainObject = DeletionBatchDomainMapper.mapEntityToDo(entity);
			await repo.updateStatus(domainObject, BatchStatus.DELETION_REQUESTED);

			const updatedEntity = await em.findOneOrFail(DeletionBatchEntity, { id: entity.id });

			expect(updatedEntity.status).toEqual(BatchStatus.DELETION_REQUESTED);
		});
	});
});
