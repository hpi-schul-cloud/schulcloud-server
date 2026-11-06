import { MikroORM } from '@mikro-orm/core';
import { type MongoDriver, ObjectId } from '@mikro-orm/mongodb';
import { HealthCheckEntity } from '@modules/health/repo/entity';
import { Test, type TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { Migration20260130082056 } from './mikro-orm/Migration20260130082056';
import { Migration20260617114638 } from './mikro-orm/Migration20260617114638';

describe('aggregation migrations with BSON documents', () => {
	let module: TestingModule;
	let orm: MikroORM<MongoDriver>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot({ entities: [HealthCheckEntity] })],
		}).compile();
		orm = module.get(MikroORM);
	});

	afterEach(async () => {
		await cleanupCollections(orm.em);
	});

	afterAll(async () => {
		await module.close();
	});

	describe(Migration20260130082056.name, () => {
		it('should retain active secondary schools and remove only obsolete entries across repeated runs', async () => {
			const users = orm.em.getCollection<{
				_id: ObjectId;
				schoolId: ObjectId;
				secondarySchools?: { school: ObjectId; role: ObjectId }[];
			}>('users');
			const userId = new ObjectId();
			const ownSchoolId = new ObjectId();
			const activeSchoolId = new ObjectId();
			const obsoleteSchoolId = new ObjectId();
			const activeEntry = { school: activeSchoolId, role: new ObjectId() };
			const groupId = new ObjectId();
			await users.insertOne({
				_id: userId,
				schoolId: ownSchoolId,
				secondarySchools: [
					activeEntry,
					{ school: obsoleteSchoolId, role: new ObjectId() },
					{ school: ownSchoolId, role: new ObjectId() },
				],
			});
			await orm.em.getCollection('groups').insertOne({
				_id: groupId,
				type: 'room',
				users: [{ user: userId }],
			});
			await orm.em.getCollection('room-memberships').insertMany([
				{ userGroup: groupId, school: activeSchoolId },
				{ userGroup: groupId, school: ownSchoolId },
				{ userGroup: new ObjectId(), school: obsoleteSchoolId },
			]);
			const migration = new Migration20260130082056(orm.em.getDriver(), orm.config);

			await migration.up();

			expect(await users.findOne({ _id: userId })).toEqual({
				_id: userId,
				schoolId: ownSchoolId,
				secondarySchools: [activeEntry],
			});
			const afterFirstRun = await users.findOne({ _id: userId });
			await migration.up();
			expect(await users.findOne({ _id: userId })).toEqual(afterFirstRun);
		});

		it('should unset obsolete arrays while leaving empty, missing and fully active arrays unchanged', async () => {
			const users = orm.em.getCollection('users');
			const ownSchoolId = new ObjectId();
			const activeSchoolId = new ObjectId();
			const obsoleteUserId = new ObjectId();
			const activeUserId = new ObjectId();
			const groupId = new ObjectId();
			const activeUser = {
				_id: activeUserId,
				schoolId: ownSchoolId,
				secondarySchools: [{ school: activeSchoolId, role: new ObjectId() }],
			};
			const emptyUser = { _id: new ObjectId(), schoolId: ownSchoolId, secondarySchools: [] };
			const missingUser = { _id: new ObjectId(), schoolId: ownSchoolId };
			await users.insertMany([
				{
					_id: obsoleteUserId,
					schoolId: ownSchoolId,
					secondarySchools: [{ school: new ObjectId(), role: new ObjectId() }],
				},
				activeUser,
				emptyUser,
				missingUser,
			]);
			await orm.em.getCollection('groups').insertOne({
				_id: groupId,
				type: 'room',
				users: [{ user: activeUserId }],
			});
			await orm.em.getCollection('room-memberships').insertOne({ userGroup: groupId, school: activeSchoolId });
			const migration = new Migration20260130082056(orm.em.getDriver(), orm.config);

			await migration.up();
			await migration.up();

			expect(await users.findOne({ _id: obsoleteUserId })).toEqual({
				_id: obsoleteUserId,
				schoolId: ownSchoolId,
			});
			for (const expected of [activeUser, emptyUser, missingUser]) {
				expect(await users.findOne({ _id: expected._id })).toEqual(expected);
			}
		});

		it('should explicitly reject rollback', () => {
			const migration = new Migration20260130082056(orm.em.getDriver(), orm.config);
			expect(() => migration.down()).toThrow('Migration cannot be reverted');
		});
	});

	describe(Migration20260617114638.name, () => {
		it('should remove only orphaned user references and preserve role data, ordering and unrelated groups', async () => {
			const groups = orm.em.getCollection('groups');
			const firstUserId = new ObjectId();
			const secondUserId = new ObjectId();
			const orphanedUserId = new ObjectId();
			await orm.em.getCollection('users').insertMany([{ _id: firstUserId }, { _id: secondUserId }]);
			const validEntries = [
				{ user: firstUserId, role: 'teacher' },
				{ user: secondUserId, role: 'student' },
			];
			const mixedGroup = {
				_id: new ObjectId(),
				name: 'mixed',
				users: [validEntries[0], { user: orphanedUserId, role: 'teacher' }, validEntries[1]],
			};
			const orphanOnlyGroup = {
				_id: new ObjectId(),
				users: [{ user: orphanedUserId, role: 'student' }],
			};
			const unaffectedGroup = { _id: new ObjectId(), users: validEntries };
			const emptyGroup = { _id: new ObjectId(), users: [] };
			const missingUsersGroup = { _id: new ObjectId(), name: 'no users' };
			await groups.insertMany([mixedGroup, orphanOnlyGroup, unaffectedGroup, emptyGroup, missingUsersGroup]);
			const migration = new Migration20260617114638(orm.em.getDriver(), orm.config);

			await migration.up();

			expect(await groups.findOne({ _id: mixedGroup._id })).toEqual({ ...mixedGroup, users: validEntries });
			expect(await groups.findOne({ _id: orphanOnlyGroup._id })).toEqual({ ...orphanOnlyGroup, users: [] });
			for (const expected of [unaffectedGroup, emptyGroup, missingUsersGroup]) {
				expect(await groups.findOne({ _id: expected._id })).toEqual(expected);
			}
			const afterFirstRun = await groups.find({}).toArray();
			await migration.up();
			expect(await groups.find({}).toArray()).toEqual(afterFirstRun);
			expect(await orm.em.getCollection('users').countDocuments()).toBe(2);
		});
	});
});
