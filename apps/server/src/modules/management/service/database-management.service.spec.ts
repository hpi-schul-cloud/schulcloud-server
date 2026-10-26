import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { type IMigrator, MikroORM } from '@mikro-orm/core';
import { EntityManager, type MongoDriver, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { createCollections } from '@testing/create-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { TEST_ENTITIES } from '../management.entity.imports';
import { DatabaseManagementService } from './database-management.service';
import { BsonConverter } from '../converter/bson.converter';

const randomChars = () => new ObjectId().toHexString();
describe('DatabaseManagementService', () => {
	let service: DatabaseManagementService;
	let module: TestingModule;
	let orm: MikroORM<MongoDriver>;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: TEST_ENTITIES })],
			providers: [DatabaseManagementService],
		}).compile();

		service = module.get(DatabaseManagementService);
		orm = module.get(MikroORM);

		const em = module.get(EntityManager);
		await createCollections(em);
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('When create collections', () => {
		/* this test no longer works with MongoDB 7.0
		  TODO - try again when mongo driver is upgraded
		it('should succeed for new collection and fail for existing', async () => {
			const random = randomChars();
			// create collection twice, second should fail
			const response = await service.createCollection(random);
			await expect(async () => service.createCollection(random)).rejects.toThrow();
		});
		 */
		it('should exist after creation with same name', async () => {
			const random = randomChars();
			let exists = await service.collectionExists(random);
			expect(exists).toEqual(false);
			await service.createCollection(random);
			exists = await service.collectionExists(random);
			expect(exists).toEqual(true);
			const collectionNames = await service.getCollectionNames();
			expect(collectionNames).toContain(random);
		});
	});

	describe('When delete a collection', () => {
		/* this test no longer works with MongoDB 7.0
			 TODO - try again when mongo driver is upgraded
		it('should fail for collection that does not exist', async () => {
			const random = randomChars();
			await expect(async () => service.dropCollection(random)).rejects.toThrow();
		});
		 */
		it('should drop existing collection', async () => {
			const random = randomChars();
			await service.createCollection(random);
			let exists = await service.collectionExists(random);
			expect(exists).toEqual(true);
			await service.dropCollection(random);
			exists = await service.collectionExists(random);
			expect(exists).toEqual(false);
		});
	});

	describe('When persist data to a collection', () => {
		it('should roundtrip Extended JSON BSON values through the active MongoDB driver', async () => {
			const converter = new BsonConverter();
			const collectionName = randomChars();
			const source = [
				{
					_id: { $oid: randomChars() },
					createdAt: { $date: '2026-01-01T00:00:00Z' },
					references: [{ $oid: randomChars() }],
					amount: { $numberDecimal: '12.50' },
					payload: { $binary: { base64: 'AQID', subType: '00' } },
				},
			];
			const documents = converter.deserialize(source).map((document) => {
				if (typeof document !== 'object' || document === null || Array.isArray(document)) {
					throw new Error('Expected a deserialized BSON document');
				}
				return document;
			});

			try {
				expect(await service.importCollection(collectionName, documents)).toBe(1);
				const exported = await service.findDocumentsOfCollection(collectionName);

				expect(exported).toHaveLength(1);
				expect(exported[0]).toHaveProperty('_id', expect.any(ObjectId));
				expect(converter.serialize(exported)).toEqual(source);
			} finally {
				if (await service.collectionExists(collectionName)) {
					await service.dropCollection(collectionName);
				}
			}
		});

		it('should find previously imported data', async () => {
			const random = randomChars();
			await service.createCollection(random);
			const sample = { _id: random, foo: 'bar' };
			await service.importCollection(random, [sample]);
			const foundDocuments = await service.findDocumentsOfCollection(random);
			expect(foundDocuments).toEqual(expect.arrayContaining([sample]));
		});
		it('should return "0" if jsonDocuments is empty', async () => {
			const random = randomChars();
			const res = await service.importCollection(random, []);
			expect(res).toEqual(0);
		});
	});

	describe('When call syncIndexes()', () => {
		it('should preserve existing MongoDB index names and options across repeated synchronization', async () => {
			const db = orm.em.getConnection().getDb();
			const users = db.collection('users');
			await db.collection('roles').createIndex({ name: 1 }, { name: 'name_1', unique: true });
			await users.createIndex({ firstName: 1, lastName: 1 }, { name: 'firstName_1_lastName_1' });
			await users.createIndex({ lastName: -1 }, { name: 'legacy_user_last_name' });

			try {
				await service.syncIndexes();

				expect(await db.collection('roles').listIndexes().toArray()).toEqual(
					expect.arrayContaining([expect.objectContaining({ name: 'name_1', key: { name: 1 }, unique: true })])
				);
				expect(await users.listIndexes().toArray()).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ name: 'firstName_1_lastName_1', key: { firstName: 1, lastName: 1 } }),
						expect.objectContaining({ name: 'legacy_user_last_name', key: { lastName: -1 } }),
						expect.objectContaining({ name: 'deletedAt_1', key: { deletedAt: 1 }, sparse: true }),
						expect.objectContaining({
							name: 'ldapId_1_source_1',
							key: { ldapId: 1, source: 1 },
							unique: true,
							partialFilterExpression: { source: { $exists: true } },
						}),
						expect.objectContaining({
							name: 'userSearchIndex2',
							textIndexVersion: 3,
							language_override: 'ignore-this-field',
						}),
					])
				);
				expect(await db.collection('sharetokens').listIndexes().toArray()).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ name: 'expiresAt_1', key: { expiresAt: 1 }, expireAfterSeconds: 0 }),
					])
				);

				const collections = (await db.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name).sort();
				const readIndexes = () =>
					Promise.all(
						collections.map(async (name) => {
							const indexes = await db
								.collection(name)
								.listIndexes()
								.map((index: { name: string; key: Record<string, unknown> }) => {
									return {
										...index,
										key: Object.entries(index.key),
									};
								})
								.toArray();
							return {
								name,
								indexes: indexes.sort((left, right) => (left.name ?? '').localeCompare(right.name ?? '')),
							};
						})
					);
				const before = await readIndexes();

				await service.syncIndexes();

				expect(await readIndexes()).toEqual(before);
			} finally {
				await users.dropIndex('legacy_user_last_name');
			}
		});

		it('should call schema.ensureIndexes()', async () => {
			const spy = jest.spyOn(orm.schema, 'ensureIndexes');
			await service.syncIndexes();
			expect(spy).toHaveBeenCalled();
		});
	});

	describe('When call migrationUp()', () => {
		const setup = () => {
			jest.spyOn(orm.migrator, 'up').mockImplementation();
		};
		it('should call migrator.up()', async () => {
			setup();
			await service.migrationUp();
			expect(orm.migrator.up).toHaveBeenCalled();
		});
		it('should call migrator.up() with from', async () => {
			setup();
			const params = { from: 'foo' };
			await service.migrationUp(params.from, undefined, undefined);
			expect(orm.migrator.up).toHaveBeenCalledWith(params);
		});
		it('should call migrator.up() with param "to"', async () => {
			setup();
			const params = { to: 'foo' };
			await service.migrationUp(undefined, params.to, undefined);
			expect(orm.migrator.up).toHaveBeenCalledWith(params);
		});
		it('should call migrator.up() with param "only"', async () => {
			setup();
			const params = { only: 'foo' };
			await service.migrationUp(undefined, undefined, params.only);
			expect(orm.migrator.up).toHaveBeenCalledWith({ migrations: [params.only] });
		});
		it('should call migrator.up() with param "only" and ignore from and to', async () => {
			setup();
			const params = { only: 'foo' };
			await service.migrationUp('bar', 'baz', params.only);
			expect(orm.migrator.up).toHaveBeenCalledWith({ migrations: [params.only] });
		});
	});

	describe('When call migrationDown()', () => {
		const setup = () => {
			jest.spyOn(orm.migrator, 'down').mockImplementation();
		};
		it('should call migrator.down()', async () => {
			setup();
			await service.migrationDown();
			expect(orm.migrator.down).toHaveBeenCalled();
		});
		it('should call migrator.down() with from', async () => {
			setup();
			const params = { from: 'foo' };
			await service.migrationDown(params.from, undefined, undefined);
			expect(orm.migrator.down).toHaveBeenCalledWith(params);
		});
		it('should call migrator.down() with param "to"', async () => {
			setup();
			const params = { to: 'foo' };
			await service.migrationDown(undefined, params.to, undefined);
			expect(orm.migrator.down).toHaveBeenCalledWith(params);
		});
		it('should call migrator.down() with param "only"', async () => {
			setup();
			const params = { only: 'foo' };
			await service.migrationDown(undefined, undefined, params.only);
			expect(orm.migrator.down).toHaveBeenCalledWith({ migrations: [params.only] });
		});
		it('should call migrator.down() with param "only" and ignore from and to', async () => {
			setup();
			const params = { only: 'foo' };
			await service.migrationDown('bar', 'baz', params.only);
			expect(orm.migrator.down).toHaveBeenCalledWith({ migrations: [params.only] });
		});
	});

	describe('When call migrationPending()', () => {
		it('should return migrator.getPending()', async () => {
			const pending = [{ name: 'Migration20260101000000' }];
			const spy = jest.spyOn(orm.migrator, 'getPending').mockResolvedValueOnce(pending);
			const result = await service.migrationPending();
			expect(spy).toHaveBeenCalled();
			expect(result).toBe(pending);
			spy.mockRestore();
		});
	});

	describe('When call migrationCreate()', () => {
		it('should call migrator.createInitial()', async () => {
			const spyGetMigrator = jest.spyOn(orm, 'migrator', 'get');
			const spyMigrator: DeepMocked<IMigrator> = createMock<IMigrator>();
			spyGetMigrator.mockReturnValue(spyMigrator);

			await service.migrationCreate();
			expect(spyMigrator.createInitial).toHaveBeenCalled();
			spyGetMigrator.mockRestore();
		});
	});
});
