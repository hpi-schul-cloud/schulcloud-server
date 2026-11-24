import { EntityManager, MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { Migration20261124120000 } from '../../../migrations/mikro-orm/Migration20261124120000';
import { roomArrangementRoomInfoFactory, roomGroupPropsFactory } from '../testing/room-arrangement.factory';
import { RoomArrangementEntity } from './entity';

// The migration lives in the migrations folder, where every file is loaded as a migration, so it is tested here.

interface StoredRoomArrangement {
	_id: ObjectId;
	user: ObjectId;
	schemaVersion?: number;
	revision?: number;
	ungroupedRoomIds?: string[];
	groups?: { id: string; name: string; collapsed: boolean; roomIds: string[] }[];
	confirmGroupDeletion?: boolean;
	items?: { id: string }[];
	updatedAt?: Date;
}

const COLLECTION = 'roomarrangements';
const BACKUP_COLLECTION = 'roomarrangements_duplicates_backup';

describe(Migration20261124120000.name, () => {
	let module: TestingModule;
	let orm: MikroORM;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [RoomArrangementEntity] })],
		}).compile();

		orm = module.get(MikroORM);
		em = module.get(EntityManager);
		jest.spyOn(console, 'info').mockImplementation(() => undefined);
	});

	afterAll(async () => {
		await module.close();
		jest.restoreAllMocks();
	});

	afterEach(async () => {
		await em.getConnection().dropCollection(COLLECTION);
		await em.getConnection().dropCollection(BACKUP_COLLECTION);
	});

	const collection = () => em.getCollection<StoredRoomArrangement>(COLLECTION);

	const createMigration = (): Migration20261124120000 => new Migration20261124120000(orm.em.getDriver(), orm.config);

	const createLegacyUserIndex = async (): Promise<void> => {
		await collection().createIndex({ user: 1 });
	};

	const findUserIndex = async () => {
		const indexes = await collection().indexes();

		return indexes.find((index) => index.name === 'user_1');
	};

	describe('up', () => {
		describe('when the collection does not exist', () => {
			it('should create the unique user index', async () => {
				const migration = createMigration();

				await migration.up();

				const index = await findUserIndex();
				expect(index).toEqual(expect.objectContaining({ key: { user: 1 }, unique: true }));
			});
		});

		describe('when legacy arrangements exist', () => {
			const setup = async () => {
				const [r1, r2, r3] = roomArrangementRoomInfoFactory.buildList(3);
				const legacy = {
					_id: new ObjectId(),
					user: new ObjectId(),
					items: [{ id: r2.id }, { id: r1.id }, { id: r2.id }, { id: r3.id }],
					updatedAt: new Date('2026-01-01T00:00:00Z'),
				};
				const empty = { _id: new ObjectId(), user: new ObjectId(), items: [] };
				const withoutItems = { _id: new ObjectId(), user: new ObjectId() };
				await createLegacyUserIndex();
				await collection().insertMany([legacy, empty, withoutItems]);

				return { legacy, empty, withoutItems, r1, r2, r3 };
			};

			it('should convert them keeping the order and removing duplicate room ids', async () => {
				const { legacy, r1, r2, r3 } = await setup();
				const migration = createMigration();

				await migration.up();

				const stored = await collection().findOne({ _id: legacy._id });
				expect(stored).toEqual({
					_id: legacy._id,
					user: legacy.user,
					schemaVersion: 2,
					revision: 0,
					ungroupedRoomIds: [r2.id, r1.id, r3.id],
					groups: [],
					confirmGroupDeletion: true,
					items: [{ id: r2.id }, { id: r1.id }, { id: r3.id }],
					updatedAt: legacy.updatedAt,
				});
			});

			it('should convert empty arrangements and arrangements without items', async () => {
				const { empty, withoutItems } = await setup();
				const migration = createMigration();

				await migration.up();

				const stored = await collection()
					.find({ _id: { $in: [empty._id, withoutItems._id] } })
					.toArray();
				expect(stored).toEqual([
					expect.objectContaining({ schemaVersion: 2, revision: 0, ungroupedRoomIds: [], groups: [], items: [] }),
					expect.objectContaining({ schemaVersion: 2, revision: 0, ungroupedRoomIds: [], groups: [], items: [] }),
				]);
			});

			it('should replace the non-unique user index with a unique one', async () => {
				await setup();
				const migration = createMigration();
				const indexBefore = await findUserIndex();

				await migration.up();

				const indexAfter = await findUserIndex();
				expect(indexBefore?.unique).toBeUndefined();
				expect(indexAfter).toEqual(expect.objectContaining({ key: { user: 1 }, unique: true }));
			});

			it('should leave the data unchanged when it runs again', async () => {
				await setup();
				const migration = createMigration();
				await migration.up();
				const storedAfterFirstRun = await collection().find().toArray();

				await migration.up();

				const storedAfterSecondRun = await collection().find().toArray();
				expect(storedAfterSecondRun).toEqual(storedAfterFirstRun);
			});
		});

		describe('when an arrangement already has groups', () => {
			const setup = async () => {
				const [r1, r2] = roomArrangementRoomInfoFactory.buildList(2);
				const group = roomGroupPropsFactory.build({ roomIds: [r2.id] });
				const grouped = {
					_id: new ObjectId(),
					user: new ObjectId(),
					schemaVersion: 2,
					revision: 4,
					ungroupedRoomIds: [r1.id],
					groups: [group],
					confirmGroupDeletion: false,
					items: [{ id: r1.id }, { id: r2.id }],
				};
				await collection().insertOne(grouped);

				return { grouped };
			};

			it('should not change it', async () => {
				const { grouped } = await setup();
				const migration = createMigration();

				await migration.up();

				const stored = await collection().findOne({ _id: grouped._id });
				expect(stored).toEqual(grouped);
			});
		});

		describe('when a user has duplicate legacy arrangements', () => {
			const setup = async () => {
				const [r1, r2, r3, r4] = roomArrangementRoomInfoFactory.buildList(4);
				const user = new ObjectId();
				const sameUpdatedAt = new Date('2026-02-01T00:00:00Z');
				const oldest = {
					_id: new ObjectId(),
					user,
					items: [{ id: r4.id }, { id: r1.id }],
					updatedAt: new Date('2026-01-01T00:00:00Z'),
				};
				const tieLowerId = {
					_id: new ObjectId('000000000000000000000001'),
					user,
					items: [{ id: r3.id }],
					updatedAt: sameUpdatedAt,
				};
				const newest = {
					_id: new ObjectId('000000000000000000000002'),
					user,
					items: [{ id: r2.id }, { id: r1.id }],
					updatedAt: sameUpdatedAt,
				};
				await collection().insertMany([oldest, newest, tieLowerId]);

				return { user, oldest, tieLowerId, newest, r1, r2, r3, r4 };
			};

			it('should keep the newest and append the missing room ids of the older ones in order', async () => {
				const { user, newest, r1, r2, r3, r4 } = await setup();
				const migration = createMigration();

				await migration.up();

				const stored = await collection().find({ user }).toArray();
				expect(stored).toEqual([
					expect.objectContaining({
						_id: newest._id,
						schemaVersion: 2,
						revision: 1,
						ungroupedRoomIds: [r2.id, r1.id, r3.id, r4.id],
						groups: [],
						items: [{ id: r2.id }, { id: r1.id }, { id: r3.id }, { id: r4.id }],
					}),
				]);
			});

			it('should back up the removed arrangements', async () => {
				const { oldest, tieLowerId } = await setup();
				const migration = createMigration();

				await migration.up();

				const backup = await em.getCollection<StoredRoomArrangement>(BACKUP_COLLECTION).find().toArray();
				expect(backup.map((document) => document._id.toHexString()).sort()).toEqual(
					[oldest._id.toHexString(), tieLowerId._id.toHexString()].sort()
				);
			});

			it('should create the unique index and be rerunnable', async () => {
				const { user } = await setup();
				const migration = createMigration();
				await migration.up();
				const storedAfterFirstRun = await collection().find({ user }).toArray();

				await migration.up();

				const storedAfterSecondRun = await collection().find({ user }).toArray();
				expect(storedAfterSecondRun).toEqual(storedAfterFirstRun);
				expect(await findUserIndex()).toEqual(expect.objectContaining({ unique: true }));
			});
		});

		describe('when exactly one duplicate arrangement of a user has groups', () => {
			const setup = async () => {
				const [r1, r2, r3] = roomArrangementRoomInfoFactory.buildList(3);
				const user = new ObjectId();
				const group = roomGroupPropsFactory.build({ roomIds: [r2.id] });
				const olderGrouped = {
					_id: new ObjectId(),
					user,
					schemaVersion: 2,
					revision: 2,
					ungroupedRoomIds: [r1.id],
					groups: [group],
					confirmGroupDeletion: true,
					items: [{ id: r1.id }, { id: r2.id }],
					updatedAt: new Date('2026-01-01T00:00:00Z'),
				};
				const newerLegacy = { _id: new ObjectId(), user, items: [{ id: r3.id }, { id: r2.id }], updatedAt: new Date() };
				await collection().insertMany([olderGrouped, newerLegacy]);

				return { user, olderGrouped, group, r1, r3 };
			};

			it('should keep the grouped arrangement and append the missing room ids', async () => {
				const { user, olderGrouped, group, r1, r3 } = await setup();
				const migration = createMigration();

				await migration.up();

				const stored = await collection().find({ user }).toArray();
				expect(stored).toEqual([
					expect.objectContaining({
						_id: olderGrouped._id,
						revision: 3,
						ungroupedRoomIds: [r1.id, r3.id],
						groups: [group],
						items: [
							{ id: r1.id },
							{ id: r3.id },
							...group.roomIds.map((id) => {
								return { id };
							}),
						],
					}),
				]);
			});
		});

		describe('when more than one duplicate arrangement of a user has groups', () => {
			const setup = async () => {
				const user = new ObjectId();
				const grouped = [1, 2].map(() => {
					return {
						_id: new ObjectId(),
						user,
						schemaVersion: 2,
						revision: 1,
						ungroupedRoomIds: [],
						groups: [roomGroupPropsFactory.build()],
						confirmGroupDeletion: true,
						items: [],
					};
				});
				const legacy = { _id: new ObjectId(), user: new ObjectId(), items: [{ id: new ObjectId().toHexString() }] };
				await createLegacyUserIndex();
				await collection().insertMany([...grouped, legacy]);

				return { user, legacy };
			};

			it('should abort without changing any data', async () => {
				const { legacy } = await setup();
				const migration = createMigration();
				const storedBefore = await collection().find().toArray();

				await expect(migration.up()).rejects.toThrow(/room arrangements with groups/);

				const storedAfter = await collection().find().toArray();
				expect(storedAfter).toEqual(storedBefore);
				expect(await collection().findOne({ _id: legacy._id })).not.toHaveProperty('schemaVersion');
				expect((await findUserIndex())?.unique).toBeUndefined();
			});
		});
	});

	describe('down', () => {
		describe('when the migration was applied', () => {
			const setup = async () => {
				const group = roomGroupPropsFactory.build({ roomIds: [new ObjectId().toHexString()] });
				const grouped = {
					_id: new ObjectId(),
					user: new ObjectId(),
					schemaVersion: 2,
					revision: 1,
					ungroupedRoomIds: [],
					groups: [group],
					confirmGroupDeletion: true,
					items: group.roomIds.map((id) => {
						return { id };
					}),
				};
				await collection().insertOne(grouped);
				const migration = createMigration();
				await migration.up();

				return { migration, grouped };
			};

			it('should make the user index non-unique and keep the grouped data', async () => {
				const { migration, grouped } = await setup();

				await migration.down();

				const index = await findUserIndex();
				expect(index).toEqual(expect.objectContaining({ key: { user: 1 } }));
				expect(index?.unique).toBeUndefined();
				expect(await collection().findOne({ _id: grouped._id })).toEqual(grouped);
			});
		});
	});
});
