import { EntityManager, MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { roomArrangementEntityFactory } from '../testing';
import {
	roomArrangementFactory,
	roomArrangementRoomInfoFactory,
	roomGroupPropsFactory,
} from '../testing/room-arrangement.factory';
import { RoomArrangementEntity } from './entity';
import { RoomArrangementRepo } from './room-arrangement.repo';

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

describe(RoomArrangementRepo.name, () => {
	let module: TestingModule;
	let repo: RoomArrangementRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [RoomArrangementEntity] })],
			providers: [RoomArrangementRepo],
		}).compile();

		repo = module.get(RoomArrangementRepo);
		em = module.get(EntityManager);
		await module.get(MikroORM).getSchemaGenerator().ensureIndexes();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	const findStoredArrangements = (userId: string): Promise<StoredRoomArrangement[]> =>
		em
			.getCollection<StoredRoomArrangement>(RoomArrangementEntity.name)
			.find({ user: new ObjectId(userId) })
			.toArray();

	describe('indexes', () => {
		it('should have a unique index on the stored field user', async () => {
			const indexes = await em.getCollection(RoomArrangementEntity.name).listIndexes().toArray();

			expect(indexes).toEqual(
				expect.arrayContaining([expect.objectContaining({ name: 'user_1', key: { user: 1 }, unique: true })])
			);
		});
	});

	describe('findOrCreateByUserId', () => {
		describe('when the user has no arrangement', () => {
			it('should create an empty arrangement with revision 0', async () => {
				const userId = new ObjectId().toHexString();

				const result = await repo.findOrCreateByUserId(userId);

				expect(result.getProps()).toEqual({
					id: expect.any(String),
					userId,
					revision: 0,
					ungroupedRoomIds: [],
					groups: [],
					confirmGroupDeletion: true,
					groupingHintDismissed: false,
				});
				const stored = await findStoredArrangements(userId);
				expect(stored).toEqual([
					expect.objectContaining({
						_id: new ObjectId(result.id),
						schemaVersion: 2,
						revision: 0,
						ungroupedRoomIds: [],
						groups: [],
						confirmGroupDeletion: true,
						groupingHintDismissed: false,
						items: [],
					}),
				]);
			});
		});

		describe('when several requests initialize the arrangement concurrently', () => {
			it('should create exactly one document and return it to every request', async () => {
				const userId = new ObjectId().toHexString();

				const results = await Promise.all([
					repo.findOrCreateByUserId(userId),
					repo.findOrCreateByUserId(userId),
					repo.findOrCreateByUserId(userId),
					repo.findOrCreateByUserId(userId),
				]);

				const stored = await findStoredArrangements(userId);
				expect(stored).toHaveLength(1);
				expect(results.map((result) => result.id)).toEqual(Array(4).fill(stored[0]._id.toHexString()));
			});
		});

		describe('when a second document for the same user is inserted', () => {
			it('should be rejected by the unique index', async () => {
				const userId = new ObjectId().toHexString();
				await repo.findOrCreateByUserId(userId);

				const insert = em
					.getCollection(RoomArrangementEntity.name)
					.insertOne({ user: new ObjectId(userId), items: [] });

				await expect(insert).rejects.toThrow(/E11000/);
			});
		});

		describe('when the user has an arrangement in the current shape', () => {
			const setup = async () => {
				const [r1, r2] = roomArrangementRoomInfoFactory.buildList(2);
				const group = roomGroupPropsFactory.build({ roomIds: [r2.id] });
				const entity = roomArrangementEntityFactory.build({
					schemaVersion: 2,
					revision: 5,
					ungroupedRoomIds: [r1.id],
					groups: [group],
					confirmGroupDeletion: false,
					items: [{ id: r1.id }, { id: r2.id }],
				});
				await em.persist(entity).flush();
				em.clear();
				const [before] = await findStoredArrangements(entity.userId);

				return { entity, before, r1, group };
			};

			it('should return it without writing', async () => {
				const { entity, before, r1, group } = await setup();

				const result = await repo.findOrCreateByUserId(entity.userId);

				expect(result.getProps()).toEqual({
					id: entity.id,
					userId: entity.userId,
					revision: 5,
					ungroupedRoomIds: [r1.id],
					groups: [group],
					confirmGroupDeletion: false,
					groupingHintDismissed: false,
				});
				const [after] = await findStoredArrangements(entity.userId);
				expect(after).toEqual(before);
			});
		});

		describe('when the user has an arrangement in the legacy shape', () => {
			const setup = async () => {
				const [r1, r2, r3] = roomArrangementRoomInfoFactory.buildList(3);
				const entity = roomArrangementEntityFactory.build({
					items: [{ id: r3.id }, { id: r1.id }, { id: r3.id }, { id: r2.id }],
				});
				await em.persist(entity).flush();
				em.clear();

				return { entity, r1, r2, r3 };
			};

			it('should convert it keeping the order and removing duplicates', async () => {
				const { entity, r1, r2, r3 } = await setup();

				const result = await repo.findOrCreateByUserId(entity.userId);

				expect(result.getProps()).toEqual({
					id: entity.id,
					userId: entity.userId,
					revision: 0,
					ungroupedRoomIds: [r3.id, r1.id, r2.id],
					groups: [],
					confirmGroupDeletion: true,
					groupingHintDismissed: false,
				});
				const stored = await findStoredArrangements(entity.userId);
				expect(stored).toEqual([
					expect.objectContaining({
						_id: new ObjectId(entity.id),
						schemaVersion: 2,
						revision: 0,
						ungroupedRoomIds: [r3.id, r1.id, r2.id],
						groups: [],
						confirmGroupDeletion: true,
						groupingHintDismissed: false,
						items: [{ id: r3.id }, { id: r1.id }, { id: r2.id }],
					}),
				]);
			});

			it('should convert it only once when read concurrently', async () => {
				const { entity } = await setup();

				const results = await Promise.all([
					repo.findOrCreateByUserId(entity.userId),
					repo.findOrCreateByUserId(entity.userId),
				]);

				expect(results.map((result) => result.revision)).toEqual([0, 0]);
				const stored = await findStoredArrangements(entity.userId);
				expect(stored).toHaveLength(1);
			});
		});

		describe('when the legacy document has no items', () => {
			it('should convert it to an empty arrangement', async () => {
				const userId = new ObjectId().toHexString();
				await em.getCollection(RoomArrangementEntity.name).insertOne({ user: new ObjectId(userId) });

				const result = await repo.findOrCreateByUserId(userId);

				expect(result.ungroupedRoomIds).toEqual([]);
				expect(result.revision).toBe(0);
			});
		});
	});

	describe('updateIfRevisionMatches', () => {
		const setup = async () => {
			const [r1, r2, r3] = roomArrangementRoomInfoFactory.buildList(3);
			const hidden = roomArrangementRoomInfoFactory.build({ isVisible: false });
			const userId = new ObjectId().toHexString();
			const initial = await repo.findOrCreateByUserId(userId);
			initial.reconcile([r1, hidden, r2, r3]);
			await repo.updateIfRevisionMatches(initial);

			return { userId, r1, r2, r3, hidden, rooms: [r1, hidden, r2, r3] };
		};

		describe('when the stored revision matches', () => {
			it('should write canonical fields and items together and increment the revision', async () => {
				const { userId, r1, r2, r3, hidden, rooms } = await setup();
				const arrangement = await repo.findOrCreateByUserId(userId);
				const groupId = new ObjectId().toHexString();
				arrangement.createGroup(groupId, 'Informatik');
				arrangement.moveRoom({ roomId: r2.id, sourceGroupId: null, targetGroupId: groupId, beforeRoomId: null }, rooms);
				arrangement.moveRoom({ roomId: r3.id, sourceGroupId: null, targetGroupId: null, beforeRoomId: r1.id }, rooms);

				const result = await repo.updateIfRevisionMatches(arrangement);

				expect(result).toBe(true);
				expect(arrangement.revision).toBe(2);
				const [stored] = await findStoredArrangements(userId);
				expect(stored).toEqual(
					expect.objectContaining({
						revision: 2,
						ungroupedRoomIds: [r3.id, r1.id, hidden.id],
						groups: [{ id: groupId, name: 'Informatik', collapsed: false, roomIds: [r2.id] }],
						items: [{ id: r3.id }, { id: r1.id }, { id: hidden.id }, { id: r2.id }],
					})
				);
			});

			it('should return the persisted state after a reload', async () => {
				const { userId, r1, rooms } = await setup();
				const arrangement = await repo.findOrCreateByUserId(userId);
				arrangement.createGroup(new ObjectId().toHexString(), 'Deutsch');
				arrangement.moveRoom({ roomId: r1.id, sourceGroupId: null, targetGroupId: null, beforeRoomId: null }, rooms);
				arrangement.updatePreferences({ confirmGroupDeletion: false, groupingHintDismissed: true });
				await repo.updateIfRevisionMatches(arrangement);

				const reloaded = await repo.findOrCreateByUserId(userId);

				expect(reloaded.getProps()).toEqual(arrangement.getProps());
			});
		});

		describe('when the stored revision differs', () => {
			it('should not write and return false', async () => {
				const { userId } = await setup();
				const stale = await repo.findOrCreateByUserId(userId);
				const current = await repo.findOrCreateByUserId(userId);
				current.createGroup(new ObjectId().toHexString(), 'Current');
				await repo.updateIfRevisionMatches(current);
				stale.createGroup(new ObjectId().toHexString(), 'Stale');

				const result = await repo.updateIfRevisionMatches(stale);

				expect(result).toBe(false);
				expect(stale.revision).toBe(1);
				const [stored] = await findStoredArrangements(userId);
				expect(stored.revision).toBe(2);
				expect(stored.groups?.map((group) => group.name)).toEqual(['Current']);
			});
		});

		describe('when two writes are based on the same revision', () => {
			it('should let exactly one of them win', async () => {
				const { userId } = await setup();
				const first = await repo.findOrCreateByUserId(userId);
				const second = await repo.findOrCreateByUserId(userId);
				first.createGroup(new ObjectId().toHexString(), 'First');
				second.createGroup(new ObjectId().toHexString(), 'Second');

				const results = await Promise.all([repo.updateIfRevisionMatches(first), repo.updateIfRevisionMatches(second)]);

				expect(results.filter((result) => result)).toHaveLength(1);
				const [stored] = await findStoredArrangements(userId);
				expect(stored.revision).toBe(2);
				expect(stored.groups).toHaveLength(1);
			});
		});

		describe('when the arrangement was deleted in the meantime', () => {
			it('should return false', async () => {
				const arrangement = roomArrangementFactory.build();

				const result = await repo.updateIfRevisionMatches(arrangement);

				expect(result).toBe(false);
			});
		});
	});

	describe('deleteArrangements', () => {
		describe('when the user has a grouped arrangement', () => {
			const setup = async () => {
				const room = roomArrangementRoomInfoFactory.build();
				const group = roomGroupPropsFactory.build({ roomIds: [room.id] });
				const entity = roomArrangementEntityFactory.build({
					schemaVersion: 2,
					revision: 3,
					ungroupedRoomIds: [],
					groups: [group],
					confirmGroupDeletion: true,
					items: [{ id: room.id }],
				});
				const otherEntity = roomArrangementEntityFactory.build();
				await em.persist([entity, otherEntity]).flush();
				em.clear();

				return { entity, otherEntity };
			};

			it('should delete the whole document including its groups', async () => {
				const { entity, otherEntity } = await setup();

				const result = await repo.deleteArrangements(entity.userId);

				expect(result).toEqual([entity.id]);
				expect(await findStoredArrangements(entity.userId)).toEqual([]);
				expect(await findStoredArrangements(otherEntity.userId)).toHaveLength(1);
			});
		});
	});
});
