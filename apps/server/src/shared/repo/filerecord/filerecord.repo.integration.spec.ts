import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, fileRecordFactory } from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@shared/infra/database';

import { FileRecord, FileRecordParentType } from '@shared/domain';
import { FileRecordRepo } from './filerecord.repo';

describe('FileRecordRepo', () => {
	let module: TestingModule;
	let repo: FileRecordRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
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

	describe('findOneById', () => {
		it('should find an entity by its id', async () => {
			const fileRecord = fileRecordFactory.build();

			await em.persistAndFlush(fileRecord);
			em.clear();

			const result = await repo.findOneById(fileRecord.id);

			expect(result).toBeDefined();
			expect(result.id).toEqual(fileRecord.id);
		});

		it('should find an entity by its id', async () => {
			const notExistingId = new ObjectId().toHexString();

			await expect(repo.findOneById(notExistingId)).rejects.toThrowError();
		});

		it('should ingnore deletedSince', async () => {
			const fileRecord = fileRecordFactory.build({ deletedSince: new Date() });

			await em.persistAndFlush(fileRecord);
			em.clear();

			const exec = async () => repo.findOneById(fileRecord.id);

			await expect(exec).rejects.toThrowError();
		});
	});

	describe('save', () => {
		it('should save the passed entity', async () => {
			const fileRecord = fileRecordFactory.build();

			await repo.save(fileRecord);
			em.clear();

			const result = await repo.findOneById(fileRecord.id);

			expect(result).toBeInstanceOf(FileRecord);
		});

		it('should update the updatedAt property', async () => {
			const fileRecord = fileRecordFactory.build();
			await em.persistAndFlush(fileRecord);
			const origUpdatedAt = fileRecord.updatedAt;

			await new Promise((resolve) => setTimeout(resolve, 20));
			fileRecord.name = `updated-${fileRecord.name}`;

			await repo.save(fileRecord);
			// load also from DB and test if value is set

			expect(fileRecord.updatedAt.getTime()).toBeGreaterThan(origUpdatedAt.getTime());
		});
	});

	describe('delete', () => {
		it('should delete single existing entity', async () => {
			const fileRecord = fileRecordFactory.build();
			await em.persistAndFlush(fileRecord);

			const exist = await repo.findOneById(fileRecord.id);
			expect(exist).toBeInstanceOf(FileRecord);

			await repo.delete(fileRecord);
			const notExistAnymore = await em.findOne(FileRecord, fileRecord.id);

			expect(notExistAnymore).not.toBeInstanceOf(FileRecord);
		});

		it('should delete many existing entity', async () => {
			const fileRecords = fileRecordFactory.buildList(3);
			await em.persistAndFlush(fileRecords);

			await repo.delete(fileRecords);
			const notExistAnymore = await em.findOne(FileRecord, fileRecords[1].id);

			expect(notExistAnymore).not.toBeInstanceOf(FileRecord);
		});
	});

	describe('findBySchoolIdAndParentId', () => {
		it('should only find searched parent', async () => {
			const parentId1 = new ObjectId().toHexString();
			const parentId2 = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();

			const fileRecords1 = fileRecordFactory.buildList(3, {
				schoolId,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});
			const fileRecords2 = fileRecordFactory.buildList(3, {
				schoolId,
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentId(schoolId, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.parentId)).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should only find searched school', async () => {
			const parentId = new ObjectId().toHexString();
			const schoolId1 = new ObjectId().toHexString();
			const schoolId2 = new ObjectId().toHexString();

			const fileRecords1 = fileRecordFactory.buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId,
			});
			const fileRecords2 = fileRecordFactory.buildList(3, {
				schoolId: schoolId2,
				parentType: FileRecordParentType.Task,
				parentId,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentId(schoolId1, parentId);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.schoolId)).toEqual([schoolId1, schoolId1, schoolId1]);
		});

		it('should ingnore deletedSince', async () => {
			const parentId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();

			const fileRecords = fileRecordFactory.buildList(3, {
				schoolId,
				parentType: FileRecordParentType.Task,
				parentId,
			});

			const fileRecordsExpired = fileRecordFactory.buildList(3, {
				schoolId,
				parentType: FileRecordParentType.Task,
				parentId,
				deletedSince: new Date(),
			});

			await em.persistAndFlush([...fileRecords, ...fileRecordsExpired]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentId(schoolId, parentId);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.id).sort()).toEqual([fileRecords[0].id, fileRecords[1].id, fileRecords[2].id].sort());
		});
	});

	describe('findBySecurityCheckRequestToken', () => {
		it('should find an entity by its requestToken', async () => {
			const schoolId = new ObjectId().toHexString();
			const parentId = new ObjectId().toHexString();

			const fileRecord = fileRecordFactory.build({
				schoolId,
				parentType: FileRecordParentType.Task,
				parentId,
			});
			const token = fileRecord.securityCheck.requestToken || '';

			await em.persistAndFlush(fileRecord);
			em.clear();

			const result = await repo.findBySecurityCheckRequestToken(token);

			expect(result).toBeInstanceOf(FileRecord);
			expect(result.securityCheck.requestToken).toEqual(token);
		});

		it('should throw error by wrong requestToken', async () => {
			const schoolId = new ObjectId().toHexString();
			const parentId = new ObjectId().toHexString();

			const fileRecord = fileRecordFactory.build({
				schoolId,
				parentType: FileRecordParentType.Task,
				parentId,
			});
			const token = 'wrong-token';

			await em.persistAndFlush(fileRecord);
			em.clear();

			await expect(repo.findBySecurityCheckRequestToken(token)).rejects.toThrow();
		});
	});
});
