import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { DataBaseManager } from '@shared/infra/database/database-manager';
import { InternalServerErrorException } from '@nestjs/common';
import { NotFoundError } from '@mikro-orm/core';
import { FileRecordRepo } from './filerecord.repo';
import { FileRecordEntity } from './filerecord.entity';
import { FileRecord, IUpdateSecurityCheckStatus, ScanStatus } from '../domain';
import { fileRecordEntityFactory } from './filerecord-entity.factory';
import { FileRecordDOMapper } from './fileRecordDO.mapper';
import { FileRecordParentType } from '../interface';

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
		// TODO: Note: maybe DataBaseManager should be used for create test data, to issolate em and prefent test to use it
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('persist', () => {
		describe('when the element to be persist does not exist in the database', () => {
			const setup = async () => {
				const fileRecordEntityDB = fileRecordEntityFactory.build();
				// must create with id, for testcase. Without persisting no id is added
				const fileRecordEntity = fileRecordEntityFactory.buildWithId();
				await em.persistAndFlush([fileRecordEntityDB]);
				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);
				const fileRecordDB = FileRecordDOMapper.entityToDO(fileRecordEntityDB);

				return { fileRecord, fileRecordDB };
			};

			it('should be throw an internal server error', async () => {
				const { fileRecord } = await setup();

				await expect(() => repo.persist([fileRecord])).rejects.toThrowError(InternalServerErrorException);
			});

			it('should be throw an internal server error', async () => {
				const { fileRecord, fileRecordDB } = await setup();

				await expect(() => repo.persist([fileRecord, fileRecordDB])).rejects.toThrowError(InternalServerErrorException);
			});
		});

		describe('when persist elements exists in database but not in the unit of work', () => {
			const setup = async () => {
				const fileRecordEntity = fileRecordEntityFactory.build();
				await em.persistAndFlush(fileRecordEntity);
				em.clear();
				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				return { fileRecord };
			};

			it('should be return instance of FileRecord', async () => {
				const { fileRecord } = await setup();

				const result = await repo.persist([fileRecord]);

				expect(result[0]).toBeInstanceOf(FileRecord);
			});

			// note: normally the keys are only tested in the mapper it self but as show case and validation also added on this place
			it('should be persist the changed name', async () => {
				const { fileRecord } = await setup();

				const newName = 'persistd name';
				fileRecord.setName(newName);

				const persistdFileRecords = await repo.persist([fileRecord]);
				const result = await em.findOne(FileRecordEntity, { id: fileRecord.id });

				expect(persistdFileRecords[0].getName()).toEqual(newName);
				expect(result?.name).toEqual(newName);
			});

			it('should be persist the changed securityCheck', async () => {
				const { fileRecord } = await setup();

				// TODO: builder?
				const scanStatus: IUpdateSecurityCheckStatus = {
					reason: 'Text 123',
					status: ScanStatus.BLOCKED,
				};
				fileRecord.updateSecurityCheckStatus(scanStatus);

				const persistdFileRecords = await repo.persist([fileRecord]);
				const result = await em.findOne(FileRecordEntity, { id: fileRecord.id });

				const { reason, status } = persistdFileRecords[0].getProps().securityCheck;

				expect(reason).toEqual(scanStatus.reason);
				expect(status).toEqual(scanStatus.status);
				expect(result?.securityCheck.reason).toEqual(scanStatus.reason);
				expect(result?.securityCheck.status).toEqual(scanStatus.status);
			});
		});

		// Note: Only for show case without em.clear
		describe('when update elements exists in database and in the unit of work', () => {
			const setup = async () => {
				const fileRecordEntity = fileRecordEntityFactory.build();
				await em.persistAndFlush(fileRecordEntity);
				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				return { fileRecord };
			};

			// note: normally the keys are only tested in the mapper it self but as show case and validation also added on this place
			it('should be persist the changed name', async () => {
				const { fileRecord } = await setup();

				const newName = 'persistd name';
				fileRecord.setName(newName);

				const persistdFileRecords = await repo.persist([fileRecord]);
				const result = await em.findOne(FileRecordEntity, { id: fileRecord.id });

				expect(persistdFileRecords[0].getName()).toEqual(newName);
				expect(result?.name).toEqual(newName);
			});

			it('should be persist the changed securityCheck', async () => {
				const { fileRecord } = await setup();

				// TODO: builder?
				const scanStatus: IUpdateSecurityCheckStatus = {
					reason: 'Text 123',
					status: ScanStatus.BLOCKED,
				};
				fileRecord.updateSecurityCheckStatus(scanStatus);

				const persistdFileRecords = await repo.persist([fileRecord]);
				const result = await em.findOne(FileRecordEntity, { id: fileRecord.id });

				const { reason, status } = persistdFileRecords[0].getProps().securityCheck;

				expect(reason).toEqual(scanStatus.reason);
				expect(status).toEqual(scanStatus.status);
				expect(result?.securityCheck.reason).toEqual(scanStatus.reason);
				expect(result?.securityCheck.status).toEqual(scanStatus.status);
			});
		});
	});

	describe('delete', () => {
		describe('when no DB record exists', () => {
			const setup = () => {
				const fileRecordEntity = fileRecordEntityFactory.buildWithId();
				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				return { fileRecord };
			};

			it('result is undefined', async () => {
				const { fileRecord } = setup();

				const result = await repo.delete([fileRecord]);

				expect(result).toBe(undefined);
			});
		});

		// Note: only show case
		describe('when DB record exists and loaded', () => {
			const setup = async () => {
				const fileRecordEntity = fileRecordEntityFactory.build();
				await em.persistAndFlush(fileRecordEntity);
				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				return { fileRecord };
			};

			it('should delete the data record', async () => {
				const { fileRecord } = await setup();

				await repo.delete([fileRecord]);

				const result = await em.findOne(FileRecordEntity, { id: fileRecord.id });

				expect(result).toBe(null);
			});
		});

		describe('when DB record exists and not loaded', () => {
			const setup = async () => {
				const fileRecordEntity = fileRecordEntityFactory.build();
				await em.persistAndFlush(fileRecordEntity);
				em.clear();
				const fileRecord = FileRecordDOMapper.entityToDO(fileRecordEntity);

				return { fileRecord };
			};

			it('result should be return nothing', async () => {
				const { fileRecord } = await setup();

				const result = await repo.delete([fileRecord]);

				expect(result).toBeUndefined();
			});

			it('result should be a entity reference with id', async () => {
				const { fileRecord } = await setup();

				await repo.delete([fileRecord]);

				const result = await em.findOne(FileRecordEntity, { id: fileRecord.id });

				expect(result).toBe(null);
			});
		});
	});

	describe('findOneById', () => {
		describe('when deletedSince is not defined', () => {
			const setup = async () => {
				const fileRecord = fileRecordEntityFactory.build();

				await em.persistAndFlush(fileRecord);
				em.clear();

				return { id: fileRecord.id };
			};

			it('should be return a instanceof FileRecord', async () => {
				const { id } = await setup();

				const result = await repo.findOneById(id);

				expect(result).toBeInstanceOf(FileRecord);
			});

			it('should find an entity by its id', async () => {
				const { id } = await setup();

				const result = await repo.findOneById(id);

				expect(result).toBeDefined();
				expect(result.id).toEqual(id);
			});
		});

		describe('when deletedSince is defined', () => {
			const setup = async () => {
				const fileRecord = fileRecordEntityFactory.markedForDelete().build();

				await em.persistAndFlush(fileRecord);
				em.clear();

				return { id: fileRecord.id };
			};

			it('should not find a element', async () => {
				const { id } = await setup();

				await expect(() => repo.findOneById(id)).rejects.toThrowError(NotFoundError);
			});
		});
	});

	describe('findOneByIdMarkedForDelete', () => {
		describe('when deletedSince is defined', () => {
			const setup = async () => {
				const fileRecord = fileRecordEntityFactory.markedForDelete().build();

				await em.persistAndFlush(fileRecord);
				em.clear();

				return { id: fileRecord.id };
			};

			it('should be return a instanceof FileRecord', async () => {
				const { id } = await setup();

				const result = await repo.findOneByIdMarkedForDelete(id);

				expect(result).toBeInstanceOf(FileRecord);
			});

			it('should find a element', async () => {
				const { id } = await setup();

				const result = await repo.findOneByIdMarkedForDelete(id);

				expect(result).toBeDefined();
				expect(result.id).toEqual(id);
			});
		});

		describe('when deletedSince is not defined', () => {
			const setup = async () => {
				const fileRecord = fileRecordEntityFactory.build();

				await em.persistAndFlush(fileRecord);
				em.clear();

				return { id: fileRecord.id };
			};

			it('should not find an element', async () => {
				const { id } = await setup();

				await expect(() => repo.findOneByIdMarkedForDelete(id)).rejects.toThrowError(NotFoundError);
			});
		});
	});

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
