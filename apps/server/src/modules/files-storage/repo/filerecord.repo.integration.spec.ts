import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { DataBaseManager } from '@shared/infra/database/database-manager';
import { FileRecordRepo } from './filerecord.repo';
import { FileRecordEntity } from './filerecord.entity';
import { FileRecord, FileRecordParentType } from '../domain';
import { fileRecordEntityFactory } from './filerecord-entity.factory';
import { FileRecordDOMapper } from './fileRecordDO.mapper';

describe('FileRecordRepo', () => {
	let module: TestingModule;
	let repo: FileRecordRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [FileRecordEntity] })],
			providers: [FileRecordRepo, DataBaseManager],
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
	/*
	describe('getEntityReferenceFromDO', () => {
		describe('when no DB record exists', () => {
			it('result should be a entity reference with id', () => {
				const fileRecord = FileRecordTestFactory.build();

				const result = repo.getEntityReferenceFromDO(fileRecord);

				expect(result.id).toBe(fileRecord.id);
				expect(result.size).toBe(undefined);
			});
		});

		describe('when DB record exists but not loaded', () => {
			it('result should be a entity reference with id', async () => {
				const fileRecordEntity = fileRecordEntityFactory.buildWithId();

				await em.persistAndFlush(fileRecordEntity);
				em.clear();

				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				const result = repo.getEntityReferenceFromDO(fileRecord);

				expect(result.id).toBe(fileRecord.id);
				expect(result.size).toBe(undefined);
			});
		});

		describe('when DB record exists and not loaded', () => {
			it('result should be a entity reference with id', async () => {
				const fileRecordEntity = fileRecordEntityFactory.buildWithId();

				await em.persistAndFlush(fileRecordEntity);

				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				const result = repo.getEntityReferenceFromDO(fileRecord);

				expect(result.id).toBe(fileRecord.id);
				expect(result.size).toBe(undefined);
			});
		});
	});
*/
	describe('update', () => {
		// TODO: test are missed
	});

	// TODO: buildWithID is bad
	describe('delete', () => {
		describe('when no DB record exists', () => {
			it('result is undefined', async () => {
				const fileRecordEntity = fileRecordEntityFactory.buildWithId();
				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				const result = await repo.delete([fileRecord]);

				expect(result).toBe(undefined);
			});
		});

		describe('when DB record exists and loaded', () => {
			it('should delete the data record', async () => {
				const fileRecordEntity = fileRecordEntityFactory.buildWithId();
				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				await em.persistAndFlush(fileRecordEntity);

				await repo.delete([fileRecord]);

				const result = await em.findOne(FileRecordEntity, { id: fileRecordEntity.id });

				expect(result).toBe(null);
			});
		});

		describe('when DB record exists and not loaded', () => {
			it('result should be a entity reference with id', async () => {
				const fileRecordEntity = fileRecordEntityFactory.buildWithId();
				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				await em.persistAndFlush(fileRecordEntity);
				em.clear();

				await repo.delete([fileRecord]);

				const result = await em.findOne(FileRecordEntity, { id: fileRecordEntity.id });

				expect(result).toBe(null);
			});
		});
	});

	describe('findOneById', () => {
		it('should find an entity by its id and deletedSince is NOT defined', async () => {
			const fileRecord = fileRecordEntityFactory.build();

			await em.persistAndFlush(fileRecord);
			em.clear();

			const result = await repo.findOneById(fileRecord.id);

			expect(result).toBeDefined();
			expect(result.id).toEqual(fileRecord.id);
		});
	});

	describe('findOneByIdMarkedForDelete', () => {
		it('should find an entity by its id and deletedSince is defined', async () => {
			const fileRecord = fileRecordEntityFactory.markedForDelete().build();

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
			const fileRecord = fileRecordEntityFactory.build();

			await em.persistAndFlush(fileRecord);
			em.clear();

			const exec = async () => repo.findOneByIdMarkedForDelete(fileRecord.id);

			await expect(exec).rejects.toThrowError();
		});
	});

	// This test must be skipped until the migration to filerecords is finished because the automatic update of timestamps is disabled for this job.
	// Temporary functionality for migration to new fileservice
	// TODO: Adjust when BC-1496 is done!
	/*
	describe.skip('save', () => {
		it('should update the updatedAt property', async () => {
			const fileRecord = fileRecordEntityFactory.build();
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
	*/

	describe('findBySchoolIdAndParentId', () => {
		const parentId1 = new ObjectId().toHexString();
		const schoolId1 = new ObjectId().toHexString();
		let fileRecords1: FileRecordEntity[];

		beforeEach(() => {
			fileRecords1 = fileRecordEntityFactory.buildList(3, {
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
			const fileRecords2 = fileRecordEntityFactory.buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentId(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.getProps().parentId)).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should only find searched school', async () => {
			const schoolId2 = new ObjectId().toHexString();
			const fileRecords2 = fileRecordEntityFactory.buildList(3, {
				schoolId: schoolId2,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentId(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.getProps().schoolId)).toEqual([schoolId1, schoolId1, schoolId1]);
		});

		it('should ingnore deletedSince', async () => {
			const fileRecordsExpired = fileRecordEntityFactory.markedForDelete().buildList(3, {
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
		let fileRecords1: FileRecordEntity[];

		beforeEach(() => {
			fileRecords1 = fileRecordEntityFactory.markedForDelete().buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});
		});

		it('should only find searched parent', async () => {
			const parentId2 = new ObjectId().toHexString();

			const fileRecords2 = fileRecordEntityFactory.markedForDelete().buildList(3, {
				schoolId: schoolId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentIdAndMarkedForDelete(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.getProps().parentId)).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should only find searched school', async () => {
			const schoolId2 = new ObjectId().toHexString();

			const fileRecords2 = fileRecordEntityFactory.markedForDelete().buildList(3, {
				schoolId: schoolId2,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findBySchoolIdAndParentIdAndMarkedForDelete(schoolId1, parentId1);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(results.map((o) => o.getProps().schoolId)).toEqual([schoolId1, schoolId1, schoolId1]);
		});

		it('should ingnore if deletedSince is undefined', async () => {
			const fileRecordsExpired = fileRecordEntityFactory.buildList(3, {
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
		let fileRecord: FileRecordEntity;

		beforeEach(() => {
			const schoolId = new ObjectId().toHexString();
			const parentId = new ObjectId().toHexString();

			fileRecord = fileRecordEntityFactory.build({
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
			expect(result.getProps().securityCheck.requestToken).toEqual(token);
		});

		it('should throw error by wrong requestToken', async () => {
			const token = 'wrong-token';

			await em.persistAndFlush(fileRecord);
			em.clear();

			await expect(repo.findBySecurityCheckRequestToken(token)).rejects.toThrow();
		});
	});
});
