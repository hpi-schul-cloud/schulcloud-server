import { NotFoundError } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { FileRecord, FileRecordParentType, StorageLocation } from '../domain';
import { fileRecordEntityFactory } from '../testing';
import { FileRecordEntity } from './file-record.entity';
import { FileRecordMikroOrmRepo } from './file-record.repo';
import { FileRecordEntityMapper } from './mapper';

const sortFunction = (a: string, b: string) => a.localeCompare(b);

describe('FileRecordRepo', () => {
	let module: TestingModule;
	let repo: FileRecordMikroOrmRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [FileRecordEntity] })],
			providers: [FileRecordMikroOrmRepo],
		}).compile();
		repo = module.get(FileRecordMikroOrmRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(FileRecordEntity);
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
			const fileRecord = fileRecordEntityFactory.withDeletedSince().build();

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

			const exec = () => repo.findOneByIdMarkedForDelete(fileRecord.id);

			await expect(exec).rejects.toThrowError();
		});
	});

	describe('save', () => {
		it('should update the updatedAt property', async () => {
			const entity = fileRecordEntityFactory.build();

			await em.persistAndFlush(entity);
			const origUpdatedAt = entity.updatedAt;

			await new Promise((resolve) => {
				setTimeout(resolve, 20);
			});
			const fileRecord = FileRecordEntityMapper.mapEntityToDo(entity);
			fileRecord.setName(`updated-${fileRecord.getName()}`);

			await repo.save(fileRecord);
			// load also from DB and test if value is set

			expect(entity.updatedAt.getTime()).toBeGreaterThan(origUpdatedAt.getTime());
		});
	});

	describe('delete', () => {
		it('should remove a single FileRecord', async () => {
			const entity = fileRecordEntityFactory.build();

			await em.persistAndFlush(entity);

			const fileRecord = FileRecordEntityMapper.mapEntityToDo(entity);

			await repo.delete(fileRecord);

			await expect(em.findOneOrFail(FileRecordEntity, fileRecord.id)).rejects.toThrow(NotFoundError);
		});

		it('should remove multiple FileRecords', async () => {
			const entities = fileRecordEntityFactory.buildList(2, {});

			await em.persistAndFlush(entities);

			const fileRecords = entities.map((entity) => FileRecordEntityMapper.mapEntityToDo(entity));

			await repo.delete(fileRecords);

			const remainingCount = await em.count(FileRecordEntity);
			expect(remainingCount).toBe(0);
		});
	});
	describe('findByParentId', () => {
		const setup = () => {
			const parentId1 = new ObjectId().toHexString();
			const fileRecords1 = fileRecordEntityFactory.buildList(3, {
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			const parentId2 = new ObjectId().toHexString();
			const fileRecords2 = fileRecordEntityFactory.buildList(3, {
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			const markedForDeleteFileRecords = fileRecordEntityFactory.withDeletedSince().buildList(3, {
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			return { fileRecords1, fileRecords2, markedForDeleteFileRecords, parentId1 };
		};

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
			expect(
				results.map((o) => {
					const props = o.getProps();
					return props.parentId;
				})
			).toEqual([parentId1, parentId1, parentId1]);
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

	describe('markForDeleteByStorageLocation', () => {
		describe('when there are many data records with different storageLocationId', () => {
			const setup = async () => {
				const storageLocationId1 = new ObjectId().toHexString();
				const fileRecords1 = fileRecordEntityFactory.buildList(3, {
					storageLocationId: storageLocationId1,
				});

				const storageLocationId2 = new ObjectId().toHexString();
				const fileRecords2 = fileRecordEntityFactory.buildList(3, {
					storageLocationId: storageLocationId2,
				});

				const markedForDeleteFileRecords = fileRecordEntityFactory.withDeletedSince().buildList(3, {
					storageLocationId: storageLocationId1,
				});

				await em.persistAndFlush([...fileRecords1, ...fileRecords2, ...markedForDeleteFileRecords]);
				em.clear();

				return { fileRecords1, fileRecords2, storageLocationId1 };
			};

			it('should only find searched fileRecords', async () => {
				const { storageLocationId1 } = await setup();

				const result = await repo.markForDeleteByStorageLocation(StorageLocation.SCHOOL, storageLocationId1);

				expect(result).toEqual(3);
			});

			it('should set deletedSince in database', async () => {
				const { storageLocationId1 } = await setup();

				await repo.markForDeleteByStorageLocation(StorageLocation.SCHOOL, storageLocationId1);

				const fileRecords = await em.find(FileRecordEntity, { storageLocationId: storageLocationId1 });

				fileRecords.forEach((fileRecord) => {
					expect(fileRecord).toMatchObject({
						deletedSince: expect.any(Date),
					});
				});
			});

			it('should return zero after two calls', async () => {
				const { storageLocationId1 } = await setup();

				await repo.markForDeleteByStorageLocation(StorageLocation.SCHOOL, storageLocationId1);
				const result = await repo.markForDeleteByStorageLocation(StorageLocation.SCHOOL, storageLocationId1);

				expect(result).toEqual(0);
			});
		});
	});

	describe('findByStorageLocationIdAndParentId', () => {
		const parentId1 = new ObjectId().toHexString();
		const storageLocationId1 = new ObjectId().toHexString();
		let fileRecords1: FileRecordEntity[];

		beforeEach(() => {
			fileRecords1 = fileRecordEntityFactory.buildList(3, {
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
			const [fileRecords, count] = await repo.findByStorageLocationIdAndParentId(
				StorageLocation.SCHOOL,
				storageLocationId1,
				parentId1,
				{
					pagination,
				}
			);

			expect(count).toEqual(3);
			expect(fileRecords.length).toEqual(1);
		});

		it('should work with pagination skip', async () => {
			await em.persistAndFlush([...fileRecords1]);
			em.clear();

			const pagination = { skip: 1 };
			const [fileRecords, count] = await repo.findByStorageLocationIdAndParentId(
				StorageLocation.SCHOOL,
				storageLocationId1,
				parentId1,
				{
					pagination,
				}
			);

			expect(count).toEqual(3);
			expect(fileRecords.length).toEqual(2);
		});

		it('should only find searched parent', async () => {
			const parentId2 = new ObjectId().toHexString();
			const fileRecords2 = fileRecordEntityFactory.buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentId(
				StorageLocation.SCHOOL,
				storageLocationId1,
				parentId1
			);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(
				results.map((o) => {
					const props = o.getProps();
					return props.parentId;
				})
			).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should only find searched school', async () => {
			const storageLocationId2 = new ObjectId().toHexString();
			const fileRecords2 = fileRecordEntityFactory.buildList(3, {
				storageLocationId: storageLocationId2,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentId(
				StorageLocation.SCHOOL,
				storageLocationId1,
				parentId1
			);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(
				results.map((o) => {
					const parentInfo = o.getParentInfo();
					return parentInfo.storageLocationId;
				})
			).toEqual([storageLocationId1, storageLocationId1, storageLocationId1]);
		});

		it('should ignore deletedSince', async () => {
			const fileRecordsExpired = fileRecordEntityFactory.withDeletedSince().buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecordsExpired]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentId(
				StorageLocation.SCHOOL,
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

	describe('findBySchoolIdAndParentIdAndMarkedForDelete', () => {
		const parentId1 = new ObjectId().toHexString();
		const storageLocationId1 = new ObjectId().toHexString();
		let fileRecords1: FileRecordEntity[];

		beforeEach(() => {
			fileRecords1 = fileRecordEntityFactory.withDeletedSince().buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});
		});

		it('should only find searched parent', async () => {
			const parentId2 = new ObjectId().toHexString();

			const fileRecords2 = fileRecordEntityFactory.withDeletedSince().buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId2,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentIdAndMarkedForDelete(
				StorageLocation.SCHOOL,
				storageLocationId1,
				parentId1
			);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(
				results.map((o) => {
					const props = o.getProps();
					return props.parentId;
				})
			).toEqual([parentId1, parentId1, parentId1]);
		});

		it('should only find searched school', async () => {
			const storageLocationId2 = new ObjectId().toHexString();

			const fileRecords2 = fileRecordEntityFactory.withDeletedSince().buildList(3, {
				storageLocationId: storageLocationId2,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecords2]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentIdAndMarkedForDelete(
				StorageLocation.SCHOOL,
				storageLocationId1,
				parentId1
			);

			expect(count).toEqual(3);
			expect(results).toHaveLength(3);
			expect(
				results.map((o) => {
					const parentInfo = o.getParentInfo();
					return parentInfo.storageLocationId;
				})
			).toEqual([storageLocationId1, storageLocationId1, storageLocationId1]);
		});

		it('should ingnore if deletedSince is undefined', async () => {
			const fileRecordsExpired = fileRecordEntityFactory.buildList(3, {
				storageLocationId: storageLocationId1,
				parentType: FileRecordParentType.Task,
				parentId: parentId1,
			});

			await em.persistAndFlush([...fileRecords1, ...fileRecordsExpired]);
			em.clear();

			const [results, count] = await repo.findByStorageLocationIdAndParentIdAndMarkedForDelete(
				StorageLocation.SCHOOL,
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
		let fileRecord: FileRecordEntity;

		beforeEach(() => {
			const storageLocationId = new ObjectId().toHexString();
			const parentId = new ObjectId().toHexString();

			fileRecord = fileRecordEntityFactory.build({
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
			expect(result.getSecurityToken()).toEqual(token);
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
			const fileRecords1 = fileRecordEntityFactory.buildList(4, {
				creatorId: creator1,
			});
			const fileRecords2 = fileRecordEntityFactory.buildList(3, {
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
			expect(
				results.map((o) => {
					const props = o.getProps();
					return props.creatorId;
				})
			).toEqual([creator1, creator1, creator1, creator1]);
		});
	});
});
