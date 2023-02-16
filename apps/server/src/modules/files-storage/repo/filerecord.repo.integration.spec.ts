import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, fileRecordFactory } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { FileRecord, FileRecordParentType } from '../entity';
import { FileRecordRepo } from './filerecord.repo';

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

	describe('findBySchoolIdAndParentId', () => {
		const parentId1 = new ObjectId().toHexString();
		const schoolId1 = new ObjectId().toHexString();
		let fileRecords1: FileRecord[];

		beforeEach(() => {
			fileRecords1 = fileRecordFactory.buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});
		});

		// TODO: the next 2 pagination test are for private stuff and must be repeated in all or outsource
		it('should work with pagination limit', async () => {
			await em.persistAndFlush([...fileRecords1]);
			em.clear();

			const pagination = { limit: 1 };
			const [fileRecords, count] = await repo.findBySchoolIdAndParentId(schoolId1, parentId1, { pagination });

			expect(count).toEqual(3);
			expect(fileRecords.length).toEqual(1);
		});

		it('should work with pagination skip', async () => {
			await em.persistAndFlush([...fileRecords1]);
			em.clear();

			const pagination = { skip: 1 };
			const [fileRecords, count] = await repo.findBySchoolIdAndParentId(schoolId1, parentId1, { pagination });

			expect(count).toEqual(3);
			expect(fileRecords.length).toEqual(2);
		});

		it('should only find searched parent', async () => {
			const parentId2 = new ObjectId().toHexString();
			const fileRecords2 = fileRecordFactory.buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentId(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.parentId)).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should only find searched school', async () => {
			const schoolId2 = new ObjectId().toHexString();
			const fileRecords2 = fileRecordFactory.buildList(3, {
				schoolId: schoolId2,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentId(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.schoolId)).toEqual([schoolId1, schoolId1, schoolId1]);
		});

		it('should ingnore deletedSince', async () => {
			const fileRecordsExpired = fileRecordFactory.markedForDelete().buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecordsExpired]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentId(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.id).sort()).toEqual(
				[fileRecords1[0].id, fileRecords1[1].id, fileRecords1[2].id].sort()
			);
		});
	});

	describe('findBySchoolIdAndParentIdAndMarkedForDelete', () => {
		const parentId1 = new ObjectId().toHexString();
		const schoolId1 = new ObjectId().toHexString();
		let fileRecords1: FileRecord[];

		beforeEach(() => {
			fileRecords1 = fileRecordFactory.markedForDelete().buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});
		});

		it('should only find searched parent', async () => {
			const parentId2 = new ObjectId().toHexString();

			const fileRecords2 = fileRecordFactory.markedForDelete().buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentIdAndMarkedForDelete(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.parentId)).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should only find searched school', async () => {
			const schoolId2 = new ObjectId().toHexString();

			const fileRecords2 = fileRecordFactory.markedForDelete().buildList(3, {
				schoolId: schoolId2,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentIdAndMarkedForDelete(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.schoolId)).toEqual([schoolId1, schoolId1, schoolId1]);
		});

		it('should ingnore if deletedSince is undefined', async () => {
			const fileRecordsExpired = fileRecordFactory.buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecordsExpired]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentIdAndMarkedForDelete(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.id).sort()).toEqual(
				[fileRecords1[0].id, fileRecords1[1].id, fileRecords1[2].id].sort()
			);
		});
	});

	describe('findBySecurityCheckRequestToken', () => {
		let fileRecord: FileRecord;

		beforeEach(() => {
			const schoolId = new ObjectId().toHexString();
			const parentId = new ObjectId().toHexString();

			fileRecord = fileRecordFactory.build({
				schoolId,
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
});
