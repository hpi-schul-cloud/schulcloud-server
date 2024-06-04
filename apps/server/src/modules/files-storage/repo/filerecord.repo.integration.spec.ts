import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, fileRecordFactory } from '@shared/testing';

import { FileRecord, FileRecordParentType } from '../entity';
import { FileRecordRepo } from './filerecord.repo';

const sortFunction = (a: string, b: string) => a.localeCompare(b);

describe('FileRecordRepo', () => {
	let module: TestingModule;
	let repo: FileRecordRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [FileRecord] })],
			providers: [FileRecordRepo],
		}).compile();
		repo = module.get(FileRecordRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(FileRecord);
	});

	describe('findOneById', () => {
		it('should find an entity by its id and deletedSince is NOT defined', async () => {
			const fileRecord = fileRecordFactory.build();

			await em.persistAndFlush(fileRecord);
			em.clear();

			const result = await repo.findOneById(fileRecord.id);

			expect(result).toBeDefined();
			expect(result.id).toEqual(fileRecord.id);
		});
	});

	describe('findOneByIdMarkedForDelete', () => {
		it('should find an entity by its id and deletedSince is defined', async () => {
			const fileRecord = fileRecordFactory.markedForDelete().build();

			await em.persistAndFlush(fileRecord);
			em.clear();

			const result = await repo.findOneByIdMarkedForDelete(fileRecord.id);

			expect(result).toBeDefined();
			expect(result.id).toEqual(fileRecord.id);
		});

		it('should find an entity by its id', async () => {
			const notExistingId = new ObjectId().toHexString();

			await expect(repo.findOneByIdMarkedForDelete(notExistingId)).rejects.toThrowError();
		});

		it('should ingnore if deletedSince is undefined', async () => {
			const fileRecord = fileRecordFactory.build();

			await em.persistAndFlush(fileRecord);
			em.clear();

			const exec = async () => repo.findOneByIdMarkedForDelete(fileRecord.id);

			await expect(exec).rejects.toThrowError();
		});
	});

	describe('save', () => {
		it('should update the updatedAt property', async () => {
			const fileRecord = fileRecordFactory.build();
			await em.persistAndFlush(fileRecord);
			const origUpdatedAt = fileRecord.updatedAt;

			await new Promise((resolve) => {
				setTimeout(resolve, 20);
			});
			fileRecord.name = `updated-${fileRecord.name}`;

			await repo.save(fileRecord);
			// load also from DB and test if value is set

			expect(fileRecord.updatedAt.getTime()).toBeGreaterThan(origUpdatedAt.getTime());
		});
	});

	describe('findByParentId', () => {
		const setup = () => {
			const parentId1 = new ObjectId().toHexString();
			const fileRecords1 = fileRecordFactory.buildList(3, {
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			const parentId2 = new ObjectId().toHexString();
			const fileRecords2 = fileRecordFactory.buildList(3, {
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			const markedForDeleteFileRecords = fileRecordFactory.markedForDelete().buildList(3, {
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			return { fileRecords1, fileRecords2, markedForDeleteFileRecords, parentId1 };
		};

		// TODO: the next 2 pagination test are for private stuff and must be repeated in all or outsource
		it('should work with pagination limit', async () => {
			const { fileRecords1, parentId1 } = setup();
			await em.persistAndFlush([...fileRecords1]);
			em.clear();

			const pagination = { limit: 1 };
			const [result, count] = await repo.findByParentId(parentId1, { pagination });

			expect(count).toEqual(3);
			expect(result.length).toEqual(1);
		});

		it('should work with pagination skip', async () => {
			const { fileRecords1, parentId1 } = setup();
			await em.persistAndFlush([...fileRecords1]);
			em.clear();

			const pagination = { skip: 1 };
			const [result, count] = await repo.findByParentId(parentId1, { pagination });

			expect(count).toEqual(3);
			expect(result.length).toEqual(2);
		});

		it('should only find searched parent', async () => {
			const { fileRecords1, fileRecords2, parentId1 } = setup();

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByParentId(parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.parentId)).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should ignore deletedSince', async () => {
			const { fileRecords1, markedForDeleteFileRecords, parentId1 } = setup();

			await em.persistAndFlush([...fileRecords1, ...markedForDeleteFileRecords]);
			em.clear();

			const [results, count] = await repo.findByParentId(parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.id).sort(sortFunction)).toEqual(
				[fileRecords1[0].id, fileRecords1[1].id, fileRecords1[2].id].sort(sortFunction)
			);
		});
	});

	describe('findByStorageLocationIdAndParentId', () => {
		const parentId1 = new ObjectId().toHexString();
		const storageLocationId1 = new ObjectId().toHexString();
		let fileRecords1: FileRecord[];

		beforeEach(() => {
			fileRecords1 = fileRecordFactory.buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});
		});

		// TODO: the next 2 pagination test are for private stuff and must be repeated in all or outsource
		it('should work with pagination limit', async () => {
			await em.persistAndFlush([...fileRecords1]);
			em.clear();

			const pagination = { limit: 1 };
			const [fileRecords, count] = await repo.findByStorageLocationIdAndParentId(storageLocationId1, parentId1, {
				pagination,
			});

			expect(count).toEqual(3);
			expect(fileRecords.length).toEqual(1);
		});

		it('should work with pagination skip', async () => {
			await em.persistAndFlush([...fileRecords1]);
			em.clear();

			const pagination = { skip: 1 };
			const [fileRecords, count] = await repo.findByStorageLocationIdAndParentId(storageLocationId1, parentId1, {
				pagination,
			});

			expect(count).toEqual(3);
			expect(fileRecords.length).toEqual(2);
		});

		it('should only find searched parent', async () => {
			const parentId2 = new ObjectId().toHexString();
			const fileRecords2 = fileRecordFactory.buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentId(storageLocationId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.parentId)).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should only find searched school', async () => {
			const storageLocationId2 = new ObjectId().toHexString();
			const fileRecords2 = fileRecordFactory.buildList(3, {
				storageLocationId: storageLocationId2,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentId(storageLocationId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.storageLocationId)).toEqual([
				storageLocationId1,
				storageLocationId1,
				storageLocationId1,
			]);
		});

		it('should ignore deletedSince', async () => {
			const fileRecordsExpired = fileRecordFactory.markedForDelete().buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecordsExpired]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentId(storageLocationId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.id).sort(sortFunction)).toEqual(
				[fileRecords1[0].id, fileRecords1[1].id, fileRecords1[2].id].sort(sortFunction)
			);
		});
	});

	describe('findBySchoolIdAndParentIdAndMarkedForDelete', () => {
		const parentId1 = new ObjectId().toHexString();
		const storageLocationId1 = new ObjectId().toHexString();
		let fileRecords1: FileRecord[];

		beforeEach(() => {
			fileRecords1 = fileRecordFactory.markedForDelete().buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});
		});

		it('should only find searched parent', async () => {
			const parentId2 = new ObjectId().toHexString();

			const fileRecords2 = fileRecordFactory.markedForDelete().buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentIdAndMarkedForDelete(
				storageLocationId1,
				parentId1
			);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.parentId)).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should only find searched school', async () => {
			const storageLocationId2 = new ObjectId().toHexString();

			const fileRecords2 = fileRecordFactory.markedForDelete().buildList(3, {
				storageLocationId: storageLocationId2,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentIdAndMarkedForDelete(
				storageLocationId1,
				parentId1
			);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.storageLocationId)).toEqual([
				storageLocationId1,
				storageLocationId1,
				storageLocationId1,
			]);
		});

		it('should ingnore if deletedSince is undefined', async () => {
			const fileRecordsExpired = fileRecordFactory.buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecordsExpired]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentIdAndMarkedForDelete(
				storageLocationId1,
				parentId1
			);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.id).sort(sortFunction)).toEqual(
				[fileRecords1[0].id, fileRecords1[1].id, fileRecords1[2].id].sort(sortFunction)
			);
		});
	});

	describe('findBySecurityCheckRequestToken', () => {
		let fileRecord: FileRecord;

		beforeEach(() => {
			const storageLocationId = new ObjectId().toHexString();
			const parentId = new ObjectId().toHexString();

			fileRecord = fileRecordFactory.build({
				storageLocationId,
				parentType: FileRecordParentType.Task,
				parentId,
			});
		});

		it('should find an entity by its requestToken', async () => {
			const token = fileRecord.securityCheck.requestToken || '';

			await em.persistAndFlush(fileRecord);
			em.clear();

			const result = await repo.findBySecurityCheckRequestToken(token);

			expect(result).toBeInstanceOf(FileRecord);
			expect(result.securityCheck.requestToken).toEqual(token);
		});

		it('should throw error by wrong requestToken', async () => {
			const token = 'wrong-token';

			await em.persistAndFlush(fileRecord);
			em.clear();

			await expect(repo.findBySecurityCheckRequestToken(token)).rejects.toThrow();
		});
	});

	describe('findByCreatorId', () => {
		const setup = () => {
			const creator1 = new ObjectId().toHexString();
			const creator2 = new ObjectId().toHexString();
			const fileRecords1 = fileRecordFactory.buildList(4, {
				creatorId: creator1,
			});
			const fileRecords2 = fileRecordFactory.buildList(3, {
				creatorId: creator2,
			});

			return { fileRecords1, fileRecords2, creator1 };
		};

		it('should only find searched creator', async () => {
			const { fileRecords1, fileRecords2, creator1 } = setup();

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByCreatorId(creator1);

			expect(count).toEqual(4);
			expect(results).toHaveLength(4);
			expect(results.map((o) => o.creatorId)).toEqual([creator1, creator1, creator1, creator1]);
		});
	});
});
