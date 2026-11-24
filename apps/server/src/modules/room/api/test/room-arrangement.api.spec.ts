import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { groupEntityFactory } from '@modules/group/testing';
import { RoomMembershipEntity } from '@modules/room-membership';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, type RoomPublicApiConfig } from '@modules/room/room.config';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoomArrangementEntity, RoomEntity } from '../../repo';
import { roomArrangementEntityFactory } from '../../testing';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { type RoomArrangementResponse, type RoomGroupCreatedResponse } from '../dto/response/room-arrangement.response';
import { type RoomListResponse } from '../dto/response/room-list.response';
import { RoomSetup } from './util/room-setup.helper';

type UserKind = 'teacher' | 'student' | 'externalPerson';

describe('Room Arrangement Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let roomsApiClient: TestApiClient;
	let config: RoomPublicApiConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'room-arrangements/me');
		roomsApiClient = new TestApiClient(app, 'rooms');
		config = moduleFixture.get<RoomPublicApiConfig>(ROOM_PUBLIC_API_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.featureRoomGroupingEnabled = true;
		config.featureRoomArchiveEnabled = true;

		await em.clearCache('roles-cache-byname-roomadmin');
		await em.clearCache('roles-cache-byname-roomowner');
		await em.clearCache('roles-cache-byname-roomviewer');
		await em.clearCache('roles-cache-byname-teacher');
	});

	afterAll(async () => {
		await app.close();
	});

	const buildUser = (kind: UserKind, school = schoolEntityFactory.buildWithId()) => {
		if (kind === 'student') {
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
			return { account: studentAccount, user: studentUser, school };
		}
		if (kind === 'externalPerson') {
			const { externalPersonAccount, externalPersonUser } = UserAndAccountTestFactory.buildExternalPerson({ school });
			return { account: externalPersonAccount, user: externalPersonUser, school };
		}
		const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
		return { account: teacherAccount, user: teacherUser, school };
	};

	const setupUserWithRooms = async (roomCount: number, kind: UserKind = 'teacher') => {
		const { account, user, school } = buildUser(kind);
		const { roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
		const role = kind === 'teacher' ? roomOwnerRole : roomViewerRole;
		const { teacherUser: owner } = UserAndAccountTestFactory.buildTeacher({ school });
		const baseTime = Date.now() - 60_000;
		const rooms = Array.from({ length: roomCount }, (_value, index) =>
			roomEntityFactory.buildWithId({ schoolId: school.id, createdAt: new Date(baseTime + index * 1000) })
		);
		const userGroups = rooms.map(() =>
			groupEntityFactory.withTypeRoom().buildWithId({
				users:
					kind === 'teacher'
						? [{ role, user }]
						: [
								{ role: roomOwnerRole, user: owner },
								{ role, user },
							],
				organization: school,
				externalSource: undefined,
			})
		);
		const memberships = rooms.map((room, index) =>
			roomMembershipEntityFactory.build({ userGroupId: userGroups[index].id, roomId: room.id, schoolId: school.id })
		);

		await em.persist([school, account, user, owner, ...rooms, ...userGroups, ...memberships]).flush();
		em.clear();

		const loggedInClient = await testApiClient.login(account);

		return { loggedInClient, account, user, school, rooms, memberships };
	};

	const findStoredArrangement = async (userId: string): Promise<RoomArrangementEntity> => {
		em.clear();
		const arrangement = await em.findOneOrFail(RoomArrangementEntity, { userId });

		return arrangement;
	};

	const getArrangement = async (client: TestApiClient): Promise<RoomArrangementResponse> => {
		const response = await client.get();

		return response.body as RoomArrangementResponse;
	};

	const createGroup = async (client: TestApiClient, name: string): Promise<RoomGroupCreatedResponse> => {
		const { revision } = await getArrangement(client);
		const response = await client.post('groups', { expectedRevision: revision, name });

		return response.body as RoomGroupCreatedResponse;
	};

	const moveRoom = async (
		client: TestApiClient,
		roomId: string,
		targetGroupId: string | null,
		beforeRoomId: string | null = null
	): Promise<RoomArrangementResponse> => {
		const arrangement = await getArrangement(client);
		const sourceGroupId = arrangement.groups.find((group) => group.roomIds.includes(roomId))?.id ?? null;
		const response = await client.patch('room-position', {
			expectedRevision: arrangement.revision,
			roomId,
			sourceGroupId,
			targetGroupId,
			beforeRoomId,
		});

		return response.body as RoomArrangementResponse;
	};

	const archiveRoom = async (roomId: string, archived: boolean): Promise<void> => {
		const update = archived ? { $set: { archivedAt: new Date() } } : { $unset: { archivedAt: '' } };
		await em.getCollection(RoomEntity.name).updateOne({ _id: new ObjectId(roomId) }, update);
		em.clear();
	};

	describe('GET /room-arrangements/me', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.get();

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				const { loggedInClient } = await setupUserWithRooms(1);
				config.featureRoomGroupingEnabled = false;

				const response = await loggedInClient.get();

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual(expect.objectContaining({ type: 'FEATURE_DISABLED' }));
			});
		});

		describe('when the user has no arrangement yet', () => {
			it('should create it with all rooms ungrouped in creation order', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(3);

				const response = await loggedInClient.get();

				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body).toEqual({
					revision: 1,
					ungroupedRoomIds: rooms.map((room) => room.id),
					groups: [],
					confirmGroupDeletion: true,
				});
				const stored = await findStoredArrangement(user.id);
				expect(stored.ungroupedRoomIds).toEqual(rooms.map((room) => room.id));
				expect(stored.items.map((item) => item.id)).toEqual(rooms.map((room) => room.id));
			});
		});

		describe('when nothing changed since the last read', () => {
			it('should not increase the revision or write the arrangement', async () => {
				const { loggedInClient, user } = await setupUserWithRooms(2);
				const first = await getArrangement(loggedInClient);
				const storedBefore = await findStoredArrangement(user.id);

				const second = await getArrangement(loggedInClient);

				const storedAfter = await findStoredArrangement(user.id);
				expect(second).toEqual(first);
				expect(storedAfter.revision).toBe(storedBefore.revision);
				expect(storedAfter.updatedAt).toEqual(storedBefore.updatedAt);
			});
		});

		describe('when the user has a legacy arrangement', () => {
			it('should keep its order', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(3);
				const legacyOrder = [rooms[2].id, rooms[0].id, rooms[1].id];
				await em
					.persist(
						roomArrangementEntityFactory.build({
							userId: user.id,
							items: legacyOrder.map((id) => {
								return { id };
							}),
						})
					)
					.flush();
				em.clear();

				const arrangement = await getArrangement(loggedInClient);

				expect(arrangement).toEqual({
					revision: 0,
					ungroupedRoomIds: legacyOrder,
					groups: [],
					confirmGroupDeletion: true,
				});
			});
		});

		describe('when a grouped room is archived and unarchived', () => {
			it('should hide it while archived and restore it into its group', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(3);
				const { createdGroupId } = await createGroup(loggedInClient, 'Informatik');
				await moveRoom(loggedInClient, rooms[1].id, createdGroupId);
				await moveRoom(loggedInClient, rooms[2].id, createdGroupId);

				await archiveRoom(rooms[1].id, true);
				const whileArchived = await getArrangement(loggedInClient);
				const storedWhileArchived = await findStoredArrangement(user.id);
				await archiveRoom(rooms[1].id, false);
				const afterUnarchive = await getArrangement(loggedInClient);

				expect(whileArchived.groups[0].roomIds).toEqual([rooms[2].id]);
				expect(storedWhileArchived.groups?.[0].roomIds).toEqual([rooms[1].id, rooms[2].id]);
				expect(afterUnarchive.groups[0].roomIds).toEqual([rooms[1].id, rooms[2].id]);
				expect(afterUnarchive.revision).toBe(whileArchived.revision);
			});
		});

		describe('when the archive feature is disabled', () => {
			it('should show archived rooms', async () => {
				const { loggedInClient, rooms } = await setupUserWithRooms(2);
				await archiveRoom(rooms[0].id, true);
				config.featureRoomArchiveEnabled = false;

				const arrangement = await getArrangement(loggedInClient);

				expect(arrangement.ungroupedRoomIds).toEqual([rooms[0].id, rooms[1].id]);
			});
		});

		describe('when the user lost the membership of a room', () => {
			it('should remove the room from the arrangement', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(2);
				const { createdGroupId } = await createGroup(loggedInClient, 'Informatik');
				await moveRoom(loggedInClient, rooms[0].id, createdGroupId);
				const before = await getArrangement(loggedInClient);
				await em.nativeDelete(RoomMembershipEntity, { roomId: rooms[0].id });

				const after = await getArrangement(loggedInClient);

				expect(after.groups[0].roomIds).toEqual([]);
				expect(after.revision).toBe(before.revision + 1);
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups?.[0].roomIds).toEqual([]);
				expect(stored.items.map((item) => item.id)).toEqual([rooms[1].id]);
			});
		});

		describe('when the user joined a new room', () => {
			it('should append it to the ungrouped rooms', async () => {
				const { loggedInClient, user, school, rooms } = await setupUserWithRooms(1);
				await getArrangement(loggedInClient);
				const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
				const newRoom = roomEntityFactory.buildWithId({ schoolId: school.id });
				const userGroup = groupEntityFactory.withTypeRoom().buildWithId({
					users: [{ role: roomOwnerRole, user }],
					organization: school,
					externalSource: undefined,
				});
				const membership = roomMembershipEntityFactory.build({
					userGroupId: userGroup.id,
					roomId: newRoom.id,
					schoolId: school.id,
				});
				em.clear();
				await em.persist([newRoom, userGroup, membership]).flush();
				em.clear();

				const arrangement = await getArrangement(loggedInClient);

				expect(arrangement.ungroupedRoomIds).toEqual([rooms[0].id, newRoom.id]);
			});
		});
	});

	describe('POST /room-arrangements/me/groups', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post('groups', { expectedRevision: 0, name: 'Informatik' });

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				const { loggedInClient } = await setupUserWithRooms(0);
				config.featureRoomGroupingEnabled = false;

				const response = await loggedInClient.post('groups', { expectedRevision: 0, name: 'Informatik' });

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the request is valid', () => {
			it('should append an empty expanded group', async () => {
				const { loggedInClient, user } = await setupUserWithRooms(1);
				const { revision } = await getArrangement(loggedInClient);

				const response = await loggedInClient.post('groups', { expectedRevision: revision, name: '  Informatik ' });

				expect(response.status).toBe(HttpStatus.CREATED);
				const body = response.body as RoomGroupCreatedResponse;
				expect(body).toEqual({
					revision: revision + 1,
					ungroupedRoomIds: expect.any(Array),
					groups: [{ id: body.createdGroupId, name: 'Informatik', collapsed: false, roomIds: [] }],
					confirmGroupDeletion: true,
					createdGroupId: expect.any(String),
				});
				const stored = await findStoredArrangement(user.id);
				expect(stored.revision).toBe(revision + 1);
				expect(stored.groups).toEqual([{ id: body.createdGroupId, name: 'Informatik', collapsed: false, roomIds: [] }]);
			});
		});

		describe.each<UserKind>(['student', 'externalPerson'])('when the user is a %s', (kind) => {
			it('should create a personal group', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(1, kind);

				const body = await createGroup(loggedInClient, 'Meine Räume');
				const moved = await moveRoom(loggedInClient, rooms[0].id, body.createdGroupId);

				expect(body.groups.map((group) => group.name)).toEqual(['Meine Räume']);
				expect(moved.groups[0].roomIds).toEqual([rooms[0].id]);
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups?.[0].roomIds).toEqual([rooms[0].id]);
			});
		});

		describe('when two users use the same group name', () => {
			it('should allow it', async () => {
				const first = await setupUserWithRooms(0);
				const second = await setupUserWithRooms(0);
				await createGroup(first.loggedInClient, 'Informatik');

				const response = await second.loggedInClient.post('groups', { expectedRevision: 0, name: 'Informatik' });

				expect(response.status).toBe(HttpStatus.CREATED);
			});
		});

		describe('when the user already has a group with the same name', () => {
			it('should return a 400 duplicate error', async () => {
				const { loggedInClient } = await setupUserWithRooms(0);
				const { revision } = await createGroup(loggedInClient, 'Informatik');

				const response = await loggedInClient.post('groups', { expectedRevision: revision, name: ' INFORMATIK ' });

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					code: 400,
					type: 'ROOM_GROUP_NAME_DUPLICATE',
					title: 'Room group name duplicate',
					message: 'Another room group of the user already has this name.',
					details: { field: 'name' },
				});
			});
		});

		describe('when the name is invalid', () => {
			it.each([
				['   ', 'REQUIRED'],
				['a'.repeat(101), 'TOO_LONG'],
				['Mathe\n6a', 'INVALID_CHARACTERS'],
			])('should return a 400 error for %j with reason %s', async (name, reason) => {
				const { loggedInClient } = await setupUserWithRooms(0);

				const response = await loggedInClient.post('groups', { expectedRevision: 0, name });

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual({
					code: 400,
					type: 'ROOM_GROUP_NAME_INVALID',
					title: 'Room group name invalid',
					message: 'The name of the room group is invalid.',
					details: { field: 'name', reason },
				});
			});
		});

		describe('when the params are not valid', () => {
			it.each([
				['a negative revision', { expectedRevision: -1, name: 'Informatik' }],
				['a non-integer revision', { expectedRevision: 0.5, name: 'Informatik' }],
				['a missing revision', { name: 'Informatik' }],
				['a missing name', { expectedRevision: 0 }],
				['a null name', { expectedRevision: 0, name: null }],
				['a name over the raw limit', { expectedRevision: 0, name: 'a'.repeat(1001) }],
			])('should return a 400 validation error for %s', async (_description, body) => {
				const { loggedInClient } = await setupUserWithRooms(0);

				const response = await loggedInClient.post('groups', body);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(expect.objectContaining({ type: 'API_VALIDATION_ERROR' }));
			});
		});

		describe('when the revision is stale', () => {
			it('should return a 409 conflict and not create the group', async () => {
				const { loggedInClient, user } = await setupUserWithRooms(1);
				const { revision } = await getArrangement(loggedInClient);
				await loggedInClient.post('groups', { expectedRevision: revision, name: 'First device' });

				const response = await loggedInClient.post('groups', { expectedRevision: revision, name: 'Second device' });

				expect(response.status).toBe(HttpStatus.CONFLICT);
				expect(response.body).toEqual({
					code: 409,
					type: 'ROOM_ARRANGEMENT_CONFLICT',
					title: 'Room arrangement conflict',
					message: 'The room arrangement was changed in the meantime. Reload it and try again.',
					details: { reason: 'REVISION' },
				});
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups?.map((group) => group.name)).toEqual(['First device']);
			});
		});
	});

	describe('PATCH /room-arrangements/me/groups/:groupId', () => {
		describe('when the group is renamed', () => {
			it('should store the normalized name', async () => {
				const { loggedInClient, user } = await setupUserWithRooms(0);
				const { revision, createdGroupId } = await createGroup(loggedInClient, 'Informatik');

				const response = await loggedInClient.patch(`groups/${createdGroupId}`, {
					expectedRevision: revision,
					name: ' informatik ',
				});

				expect(response.status).toBe(HttpStatus.OK);
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups?.[0]).toEqual({ id: createdGroupId, name: 'informatik', collapsed: false, roomIds: [] });
				expect(stored.revision).toBe(revision + 1);
			});
		});

		describe('when the group is collapsed', () => {
			it('should store the collapsed state and keep the name', async () => {
				const { loggedInClient, user } = await setupUserWithRooms(0);
				const { revision, createdGroupId } = await createGroup(loggedInClient, 'Informatik');

				const response = await loggedInClient.patch(`groups/${createdGroupId}`, {
					expectedRevision: revision,
					collapsed: true,
				});

				expect((response.body as RoomArrangementResponse).groups[0]).toEqual(
					expect.objectContaining({ name: 'Informatik', collapsed: true })
				);
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups?.[0].collapsed).toBe(true);
			});
		});

		describe('when nothing changes', () => {
			it('should succeed without increasing the revision', async () => {
				const { loggedInClient } = await setupUserWithRooms(0);
				const { revision, createdGroupId } = await createGroup(loggedInClient, 'Informatik');

				const response = await loggedInClient.patch(`groups/${createdGroupId}`, {
					expectedRevision: revision,
					name: 'Informatik',
					collapsed: false,
				});

				expect(response.status).toBe(HttpStatus.OK);
				expect((response.body as RoomArrangementResponse).revision).toBe(revision);
			});
		});

		describe('when name or collapsed is explicitly null', () => {
			it.each([
				['collapsed', { collapsed: null }],
				['name', { name: null }],
				['collapsed with a valid name', { name: 'Deutsch', collapsed: null }],
			])(
				'should return a 400 validation error for a null %s and not change the group',
				async (_description, params) => {
					const { loggedInClient, user } = await setupUserWithRooms(0);
					const { revision, createdGroupId } = await createGroup(loggedInClient, 'Informatik');

					const response = await loggedInClient.patch(`groups/${createdGroupId}`, {
						expectedRevision: revision,
						...params,
					});

					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					expect(response.body).toEqual(expect.objectContaining({ type: 'API_VALIDATION_ERROR' }));
					const stored = await findStoredArrangement(user.id);
					expect(stored.groups?.[0]).toEqual({ id: createdGroupId, name: 'Informatik', collapsed: false, roomIds: [] });
					expect(stored.revision).toBe(revision);
				}
			);
		});

		describe('when neither name nor collapsed is given', () => {
			it('should return a 400 validation error', async () => {
				const { loggedInClient } = await setupUserWithRooms(0);
				const { revision, createdGroupId } = await createGroup(loggedInClient, 'Informatik');

				const response = await loggedInClient.patch(`groups/${createdGroupId}`, { expectedRevision: revision });

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(expect.objectContaining({ type: 'API_VALIDATION_ERROR' }));
			});
		});

		describe('when the group id is malformed', () => {
			it('should return a 400 validation error', async () => {
				const { loggedInClient } = await setupUserWithRooms(0);

				const response = await loggedInClient.patch('groups/not-an-id', { expectedRevision: 0, collapsed: true });

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the group belongs to another user or does not exist', () => {
			it('should return a 404 error', async () => {
				const owner = await setupUserWithRooms(0);
				const { createdGroupId } = await createGroup(owner.loggedInClient, 'Informatik');
				const other = await setupUserWithRooms(0);
				await createGroup(other.loggedInClient, 'Deutsch');

				const foreign = await other.loggedInClient.patch(`groups/${createdGroupId}`, {
					expectedRevision: 1,
					collapsed: true,
				});
				const guessed = await other.loggedInClient.patch(`groups/${new ObjectId().toHexString()}`, {
					expectedRevision: 1,
					collapsed: true,
				});

				expect(foreign.status).toBe(HttpStatus.NOT_FOUND);
				expect(foreign.body).toEqual(expect.objectContaining({ code: 404, type: 'ROOM_GROUP_NOT_FOUND' }));
				expect(guessed.status).toBe(HttpStatus.NOT_FOUND);
				const ownerStored = await findStoredArrangement(owner.user.id);
				expect(ownerStored.groups?.[0].collapsed).toBe(false);
			});
		});
	});

	describe('DELETE /room-arrangements/me/groups/:groupId', () => {
		const setupGroupWithRooms = async () => {
			const fixtures = await setupUserWithRooms(3);
			const { loggedInClient, rooms } = fixtures;
			const { createdGroupId } = await createGroup(loggedInClient, 'Informatik');
			await moveRoom(loggedInClient, rooms[1].id, createdGroupId);
			await moveRoom(loggedInClient, rooms[2].id, createdGroupId);
			const { revision } = await getArrangement(loggedInClient);

			return { ...fixtures, groupId: createdGroupId, revision };
		};

		describe('when the group is deleted', () => {
			it('should append its rooms to the ungrouped rooms and keep the rooms', async () => {
				const { loggedInClient, user, rooms, groupId, revision } = await setupGroupWithRooms();

				const response = await loggedInClient.delete(`groups/${groupId}`, { expectedRevision: revision });

				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body).toEqual({
					revision: revision + 1,
					ungroupedRoomIds: [rooms[0].id, rooms[1].id, rooms[2].id],
					groups: [],
					confirmGroupDeletion: true,
				});
				const storedRooms = await em.find(RoomEntity, {});
				expect(storedRooms.map((room) => room.id).sort()).toEqual(rooms.map((room) => room.id).sort());
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups).toEqual([]);
				expect(stored.confirmGroupDeletion).toBe(true);
			});
		});

		describe('when future confirmations are disabled with the deletion', () => {
			it('should store the preference in the same change', async () => {
				const { loggedInClient, user, groupId, revision } = await setupGroupWithRooms();

				const response = await loggedInClient.delete(`groups/${groupId}`, {
					expectedRevision: revision,
					disableFutureConfirmation: true,
				});

				expect((response.body as RoomArrangementResponse).confirmGroupDeletion).toBe(false);
				const stored = await findStoredArrangement(user.id);
				expect(stored.confirmGroupDeletion).toBe(false);
				expect(stored.revision).toBe(revision + 1);
			});
		});

		describe('when a room of the group is archived', () => {
			it('should release the archived room too, so that it is ungrouped after unarchiving', async () => {
				const { loggedInClient, user, rooms, groupId } = await setupGroupWithRooms();
				await archiveRoom(rooms[1].id, true);
				const { revision } = await getArrangement(loggedInClient);

				const response = await loggedInClient.delete(`groups/${groupId}`, { expectedRevision: revision });

				expect((response.body as RoomArrangementResponse).ungroupedRoomIds).toEqual([rooms[0].id, rooms[2].id]);
				const stored = await findStoredArrangement(user.id);
				expect(stored.ungroupedRoomIds).toEqual([rooms[0].id, rooms[1].id, rooms[2].id]);
				await archiveRoom(rooms[1].id, false);
				const afterUnarchive = await getArrangement(loggedInClient);
				expect(afterUnarchive.ungroupedRoomIds).toEqual([rooms[0].id, rooms[1].id, rooms[2].id]);
			});
		});

		describe('when the revision in the body is stale', () => {
			it('should return a 409 conflict and keep the group', async () => {
				const { loggedInClient, user, groupId, revision } = await setupGroupWithRooms();

				const response = await loggedInClient.delete(`groups/${groupId}`, {
					expectedRevision: revision - 1,
					disableFutureConfirmation: true,
				});

				expect(response.status).toBe(HttpStatus.CONFLICT);
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups).toHaveLength(1);
				expect(stored.confirmGroupDeletion).toBe(true);
			});
		});

		describe('when disableFutureConfirmation is explicitly null', () => {
			it('should return a 400 validation error and keep the group', async () => {
				const { loggedInClient, user, groupId, revision } = await setupGroupWithRooms();

				const response = await loggedInClient.delete(`groups/${groupId}`, {
					expectedRevision: revision,
					disableFutureConfirmation: null,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(expect.objectContaining({ type: 'API_VALIDATION_ERROR' }));
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups).toHaveLength(1);
				expect(stored.revision).toBe(revision);
			});
		});

		describe('when the body is missing', () => {
			it('should return a 400 validation error', async () => {
				const { loggedInClient, groupId } = await setupGroupWithRooms();

				const response = await loggedInClient.delete(`groups/${groupId}`);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the group does not exist', () => {
			it('should return a 404 error', async () => {
				const { loggedInClient, revision } = await setupGroupWithRooms();

				const response = await loggedInClient.delete(`groups/${new ObjectId().toHexString()}`, {
					expectedRevision: revision,
				});

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});
	});

	describe('PATCH /room-arrangements/me/group-order', () => {
		const setupGroups = async () => {
			const fixtures = await setupUserWithRooms(0);
			const first = await createGroup(fixtures.loggedInClient, 'A');
			const second = await createGroup(fixtures.loggedInClient, 'B');
			const third = await createGroup(fixtures.loggedInClient, 'C');

			return {
				...fixtures,
				groupIds: [first.createdGroupId, second.createdGroupId, third.createdGroupId],
				revision: third.revision,
			};
		};

		describe('when the order is a permutation', () => {
			it('should store the new order', async () => {
				const { loggedInClient, user, groupIds, revision } = await setupGroups();
				const newOrder = [groupIds[2], groupIds[0], groupIds[1]];

				const response = await loggedInClient.patch('group-order', { expectedRevision: revision, groupIds: newOrder });

				expect(response.status).toBe(HttpStatus.OK);
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups?.map((group) => group.id)).toEqual(newOrder);
			});
		});

		describe('when the order is not an exact permutation', () => {
			it.each([
				['omitted', (ids: string[]) => [ids[0], ids[1]]],
				['duplicate', (ids: string[]) => [ids[0], ids[1], ids[1]]],
				['unknown', (ids: string[]) => [ids[0], ids[1], new ObjectId().toHexString()]],
			])('should return a 400 error for %s ids', async (_description, buildIds) => {
				const { loggedInClient, groupIds, revision } = await setupGroups();

				const response = await loggedInClient.patch('group-order', {
					expectedRevision: revision,
					groupIds: buildIds(groupIds),
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({ code: 400, type: 'ROOM_ARRANGEMENT_INVALID_GROUP_ORDER' })
				);
			});
		});

		describe('when an id is malformed', () => {
			it('should return a 400 validation error', async () => {
				const { loggedInClient, revision } = await setupGroups();

				const response = await loggedInClient.patch('group-order', { expectedRevision: revision, groupIds: ['x'] });

				expect(response.body).toEqual(expect.objectContaining({ type: 'API_VALIDATION_ERROR' }));
			});
		});
	});

	describe('PATCH /room-arrangements/me/room-position', () => {
		describe('when a room is assigned to a group and reordered', () => {
			it('should store the new positions', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(4);
				const { createdGroupId } = await createGroup(loggedInClient, 'Informatik');

				await moveRoom(loggedInClient, rooms[1].id, createdGroupId);
				await moveRoom(loggedInClient, rooms[3].id, createdGroupId, rooms[1].id);
				const result = await moveRoom(loggedInClient, rooms[2].id, null, rooms[0].id);

				expect(result.ungroupedRoomIds).toEqual([rooms[2].id, rooms[0].id]);
				expect(result.groups[0].roomIds).toEqual([rooms[3].id, rooms[1].id]);
				const stored = await findStoredArrangement(user.id);
				expect(stored.ungroupedRoomIds).toEqual([rooms[2].id, rooms[0].id]);
				expect(stored.groups?.[0].roomIds).toEqual([rooms[3].id, rooms[1].id]);
				expect(stored.items.map((item) => item.id)).toEqual([rooms[2].id, rooms[0].id, rooms[3].id, rooms[1].id]);
			});
		});

		describe('when the user is not a member of the room', () => {
			it('should return a 403 error', async () => {
				const { loggedInClient } = await setupUserWithRooms(1);
				const other = await setupUserWithRooms(1);
				const { revision } = await getArrangement(loggedInClient);

				const response = await loggedInClient.patch('room-position', {
					expectedRevision: revision,
					roomId: other.rooms[0].id,
					sourceGroupId: null,
					targetGroupId: null,
					beforeRoomId: null,
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the room is locked', () => {
			const setupLockedRoom = async () => {
				const roomSetup = new RoomSetup(em, testApiClient);
				await roomSetup.setup([
					['Teacher', 'sameSchool', 'teacher', 'roomadmin'],
					['Admin', 'sameSchool', 'administrator', 'roomviewer'],
				]);

				return roomSetup;
			};

			it('should return a 403 error for a teacher', async () => {
				const roomSetup = await setupLockedRoom();
				const loggedInClient = await roomSetup.loginUser('Teacher');
				const { createdGroupId, revision } = await createGroup(loggedInClient, 'Gesperrt');

				const response = await loggedInClient.patch('room-position', {
					expectedRevision: revision,
					roomId: roomSetup.room.id,
					sourceGroupId: null,
					targetGroupId: createdGroupId,
					beforeRoomId: null,
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});

			it('should allow a school room administrator to arrange it', async () => {
				const roomSetup = await setupLockedRoom();
				const loggedInClient = await roomSetup.loginUser('Admin');
				const { createdGroupId } = await createGroup(loggedInClient, 'Gesperrt');

				const result = await moveRoom(loggedInClient, roomSetup.room.id, createdGroupId);

				expect(result.groups[0].roomIds).toEqual([roomSetup.room.id]);
			});
		});

		describe('when the source group does not match the current location', () => {
			it('should return a 409 state conflict', async () => {
				const { loggedInClient, rooms } = await setupUserWithRooms(1);
				const { createdGroupId, revision } = await createGroup(loggedInClient, 'Informatik');

				const response = await loggedInClient.patch('room-position', {
					expectedRevision: revision,
					roomId: rooms[0].id,
					sourceGroupId: createdGroupId,
					targetGroupId: null,
					beforeRoomId: null,
				});

				expect(response.status).toBe(HttpStatus.CONFLICT);
				expect(response.body).toEqual(expect.objectContaining({ details: { reason: 'STATE' } }));
			});
		});

		describe('when the target group is unknown', () => {
			it('should return a 404 error', async () => {
				const { loggedInClient, rooms } = await setupUserWithRooms(1);
				const { revision } = await getArrangement(loggedInClient);

				const response = await loggedInClient.patch('room-position', {
					expectedRevision: revision,
					roomId: rooms[0].id,
					sourceGroupId: null,
					targetGroupId: new ObjectId().toHexString(),
					beforeRoomId: null,
				});

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when the anchor is invalid', () => {
			it.each(['self', 'otherSection'])('should return a 400 error for an anchor in %s', async (kind) => {
				const { loggedInClient, rooms } = await setupUserWithRooms(2);
				const { createdGroupId, revision } = await createGroup(loggedInClient, 'Informatik');

				const response = await loggedInClient.patch('room-position', {
					expectedRevision: revision,
					roomId: rooms[0].id,
					sourceGroupId: null,
					targetGroupId: kind === 'self' ? null : createdGroupId,
					beforeRoomId: kind === 'self' ? rooms[0].id : rooms[1].id,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(expect.objectContaining({ type: 'ROOM_ARRANGEMENT_INVALID_POSITION' }));
			});
		});

		describe('when the params are not valid', () => {
			it.each([
				['a malformed room id', { roomId: 'x', sourceGroupId: null, targetGroupId: null, beforeRoomId: null }],
				['a missing source group key', { targetGroupId: null, beforeRoomId: null }],
				['a malformed anchor', { sourceGroupId: null, targetGroupId: null, beforeRoomId: 'x' }],
			])('should return a 400 validation error for %s', async (_description, params) => {
				const { loggedInClient, rooms } = await setupUserWithRooms(1);

				const response = await loggedInClient.patch('room-position', {
					expectedRevision: 1,
					roomId: rooms[0].id,
					...params,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(expect.objectContaining({ type: 'API_VALIDATION_ERROR' }));
			});
		});
	});

	describe('PATCH /room-arrangements/me/group-collapse', () => {
		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				const { loggedInClient } = await setupUserWithRooms(0);
				config.featureRoomGroupingEnabled = false;

				const response = await loggedInClient.patch('group-collapse', { expectedRevision: 0, collapsed: true });

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when groups change', () => {
			it('should collapse every group', async () => {
				const { loggedInClient, user } = await setupUserWithRooms(0);
				await createGroup(loggedInClient, 'A');
				const { revision } = await createGroup(loggedInClient, 'B');

				const response = await loggedInClient.patch('group-collapse', { expectedRevision: revision, collapsed: true });

				expect(response.status).toBe(HttpStatus.OK);
				expect((response.body as RoomArrangementResponse).revision).toBe(revision + 1);
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups?.map((group) => group.collapsed)).toEqual([true, true]);
			});
		});

		describe('when every group already has the value', () => {
			it('should succeed without increasing the revision', async () => {
				const { loggedInClient, user } = await setupUserWithRooms(0);
				await createGroup(loggedInClient, 'A');
				const { revision } = await createGroup(loggedInClient, 'B');

				const response = await loggedInClient.patch('group-collapse', { expectedRevision: revision, collapsed: false });

				expect(response.status).toBe(HttpStatus.OK);
				expect((response.body as RoomArrangementResponse).revision).toBe(revision);
				const stored = await findStoredArrangement(user.id);
				expect(stored.revision).toBe(revision);
			});
		});

		describe('when collapsed is missing or null', () => {
			it.each([[{}], [{ collapsed: null }]])('should return a 400 validation error for %j', async (params) => {
				const { loggedInClient } = await setupUserWithRooms(0);

				const response = await loggedInClient.patch('group-collapse', { expectedRevision: 0, ...params });

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});
	});

	describe('PATCH /room-arrangements/me/room-positions', () => {
		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				const { loggedInClient, rooms } = await setupUserWithRooms(1);
				config.featureRoomGroupingEnabled = false;

				const response = await loggedInClient.patch('room-positions', {
					expectedRevision: 0,
					roomIds: [rooms[0].id],
					targetGroupId: null,
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when several rooms are moved into a group', () => {
			it('should append them in the listed order in one revision step', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(4);
				const { createdGroupId } = await createGroup(loggedInClient, 'Informatik');
				await moveRoom(loggedInClient, rooms[0].id, createdGroupId);
				const { revision } = await getArrangement(loggedInClient);

				const response = await loggedInClient.patch('room-positions', {
					expectedRevision: revision,
					roomIds: [rooms[3].id, rooms[0].id, rooms[1].id],
					targetGroupId: createdGroupId,
				});

				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body).toEqual({
					revision: revision + 1,
					ungroupedRoomIds: [rooms[2].id],
					groups: [
						{
							id: createdGroupId,
							name: 'Informatik',
							collapsed: false,
							roomIds: [rooms[3].id, rooms[0].id, rooms[1].id],
						},
					],
					confirmGroupDeletion: true,
				});
				const stored = await findStoredArrangement(user.id);
				expect(stored.revision).toBe(revision + 1);
				expect(stored.ungroupedRoomIds).toEqual([rooms[2].id]);
				expect(stored.groups?.[0].roomIds).toEqual([rooms[3].id, rooms[0].id, rooms[1].id]);
				expect(stored.items.map((item) => item.id)).toEqual([rooms[2].id, rooms[3].id, rooms[0].id, rooms[1].id]);
			});
		});

		describe('when the target is null', () => {
			it('should move the rooms to the ungrouped rooms and keep hidden rooms in place', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(3);
				const { createdGroupId } = await createGroup(loggedInClient, 'Informatik');
				await moveRoom(loggedInClient, rooms[0].id, createdGroupId);
				await moveRoom(loggedInClient, rooms[1].id, createdGroupId);
				await moveRoom(loggedInClient, rooms[2].id, createdGroupId);
				await archiveRoom(rooms[1].id, true);
				const { revision } = await getArrangement(loggedInClient);

				const response = await loggedInClient.patch('room-positions', {
					expectedRevision: revision,
					roomIds: [rooms[2].id, rooms[0].id],
					targetGroupId: null,
				});

				expect((response.body as RoomArrangementResponse).ungroupedRoomIds).toEqual([rooms[2].id, rooms[0].id]);
				const stored = await findStoredArrangement(user.id);
				expect(stored.ungroupedRoomIds).toEqual([rooms[2].id, rooms[0].id]);
				expect(stored.groups?.[0].roomIds).toEqual([rooms[1].id]);
			});
		});

		describe('when the result equals the current state', () => {
			it('should succeed without increasing the revision', async () => {
				const { loggedInClient, rooms } = await setupUserWithRooms(2);
				const { revision } = await getArrangement(loggedInClient);

				const response = await loggedInClient.patch('room-positions', {
					expectedRevision: revision,
					roomIds: [rooms[1].id],
					targetGroupId: null,
				});

				expect(response.status).toBe(HttpStatus.OK);
				expect((response.body as RoomArrangementResponse).revision).toBe(revision);
			});
		});

		describe('when the revision is stale', () => {
			it('should return a 409 conflict and apply nothing', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(2);
				const { createdGroupId, revision } = await createGroup(loggedInClient, 'Informatik');

				const response = await loggedInClient.patch('room-positions', {
					expectedRevision: revision - 1,
					roomIds: [rooms[0].id],
					targetGroupId: createdGroupId,
				});

				expect(response.status).toBe(HttpStatus.CONFLICT);
				expect(response.body).toEqual(expect.objectContaining({ details: { reason: 'REVISION' } }));
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups?.[0].roomIds).toEqual([]);
			});
		});

		describe('when the target group belongs to another user or does not exist', () => {
			it('should return a 404 error', async () => {
				const owner = await setupUserWithRooms(0);
				const { createdGroupId } = await createGroup(owner.loggedInClient, 'Informatik');
				const { loggedInClient, rooms } = await setupUserWithRooms(1);
				const { revision } = await getArrangement(loggedInClient);

				const foreign = await loggedInClient.patch('room-positions', {
					expectedRevision: revision,
					roomIds: [rooms[0].id],
					targetGroupId: createdGroupId,
				});
				const unknown = await loggedInClient.patch('room-positions', {
					expectedRevision: revision,
					roomIds: [rooms[0].id],
					targetGroupId: new ObjectId().toHexString(),
				});

				expect(foreign.status).toBe(HttpStatus.NOT_FOUND);
				expect(foreign.body).toEqual(expect.objectContaining({ type: 'ROOM_GROUP_NOT_FOUND' }));
				expect(unknown.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when one of the rooms is not a membership room', () => {
			it('should return a 403 error and apply nothing', async () => {
				const { loggedInClient, user, rooms } = await setupUserWithRooms(1);
				const other = await setupUserWithRooms(1);
				const { createdGroupId, revision } = await createGroup(loggedInClient, 'Informatik');

				const response = await loggedInClient.patch('room-positions', {
					expectedRevision: revision,
					roomIds: [rooms[0].id, other.rooms[0].id],
					targetGroupId: createdGroupId,
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
				const stored = await findStoredArrangement(user.id);
				expect(stored.groups?.[0].roomIds).toEqual([]);
				expect(stored.revision).toBe(revision);
			});
		});

		describe('when one of the rooms is locked', () => {
			it('should return a 403 error for a teacher', async () => {
				const roomSetup = new RoomSetup(em, testApiClient);
				await roomSetup.setup([['Teacher', 'sameSchool', 'teacher', 'roomadmin']]);
				const loggedInClient = await roomSetup.loginUser('Teacher');
				const { createdGroupId, revision } = await createGroup(loggedInClient, 'Gesperrt');

				const response = await loggedInClient.patch('room-positions', {
					expectedRevision: revision,
					roomIds: [roomSetup.room.id],
					targetGroupId: createdGroupId,
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the params are not valid', () => {
			it.each([
				[
					'empty room ids',
					() => {
						return { roomIds: [], targetGroupId: null };
					},
				],
				[
					'duplicate room ids',
					(roomId: string) => {
						return { roomIds: [roomId, roomId], targetGroupId: null };
					},
				],
				[
					'a malformed room id',
					() => {
						return { roomIds: ['x'], targetGroupId: null };
					},
				],
				[
					'a missing target key',
					(roomId: string) => {
						return { roomIds: [roomId] };
					},
				],
			])('should return a 400 validation error for %s', async (_description, buildBody) => {
				const { loggedInClient, rooms } = await setupUserWithRooms(1);
				const body = buildBody(rooms[0].id);

				const response = await loggedInClient.patch('room-positions', { expectedRevision: 1, ...body });

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(expect.objectContaining({ type: 'API_VALIDATION_ERROR' }));
			});
		});
	});

	describe('PATCH /room-arrangements/me/preferences', () => {
		describe('when the preference changes', () => {
			it('should store it', async () => {
				const { loggedInClient, user } = await setupUserWithRooms(0);
				const { revision } = await getArrangement(loggedInClient);

				const response = await loggedInClient.patch('preferences', {
					expectedRevision: revision,
					confirmGroupDeletion: false,
				});

				expect(response.status).toBe(HttpStatus.OK);
				const stored = await findStoredArrangement(user.id);
				expect(stored.confirmGroupDeletion).toBe(false);
				expect(stored.revision).toBe(revision + 1);
			});
		});

		describe('when the preference is unchanged', () => {
			it('should not increase the revision', async () => {
				const { loggedInClient } = await setupUserWithRooms(0);
				const { revision } = await getArrangement(loggedInClient);

				const response = await loggedInClient.patch('preferences', {
					expectedRevision: revision,
					confirmGroupDeletion: true,
				});

				expect((response.body as RoomArrangementResponse).revision).toBe(revision);
			});
		});
	});

	describe('GET /rooms', () => {
		describe('when the user has groups', () => {
			it('should return the rooms flattened: ungrouped first, then every group in order', async () => {
				const { loggedInClient, account, rooms } = await setupUserWithRooms(4);
				const first = await createGroup(loggedInClient, 'A');
				const second = await createGroup(loggedInClient, 'B');
				await moveRoom(loggedInClient, rooms[0].id, second.createdGroupId);
				await moveRoom(loggedInClient, rooms[1].id, first.createdGroupId);
				config.featureRoomGroupingEnabled = false;
				const roomsClient = await roomsApiClient.login(account);

				const response = await roomsClient.get();

				expect(response.status).toBe(HttpStatus.OK);
				const body = response.body as RoomListResponse;
				expect(body.data.map((room) => room.id)).toEqual([rooms[2].id, rooms[3].id, rooms[1].id, rooms[0].id]);
				expect(body.data[0]).toEqual(
					expect.objectContaining({ isLocked: false, totalMembers: 1, allowedOperations: expect.any(Object) })
				);
			});
		});
	});

	describe('PATCH /rooms (legacy move)', () => {
		describe('when the user has no groups', () => {
			it('should move the room and increase the revision', async () => {
				const { loggedInClient, account, user, rooms } = await setupUserWithRooms(3);
				const { revision } = await getArrangement(loggedInClient);
				const roomsClient = await roomsApiClient.login(account);

				const response = await roomsClient.patch('', { id: rooms[2].id, toPosition: 0 });

				expect(response.status).toBe(HttpStatus.NO_CONTENT);
				const stored = await findStoredArrangement(user.id);
				expect(stored.ungroupedRoomIds).toEqual([rooms[2].id, rooms[0].id, rooms[1].id]);
				expect(stored.revision).toBe(revision + 1);
			});

			it('should keep hidden archived rooms in place', async () => {
				const { loggedInClient, account, user, rooms } = await setupUserWithRooms(3);
				await getArrangement(loggedInClient);
				await archiveRoom(rooms[1].id, true);
				const roomsClient = await roomsApiClient.login(account);

				const response = await roomsClient.patch('', { id: rooms[0].id, toPosition: 1 });

				expect(response.status).toBe(HttpStatus.NO_CONTENT);
				const stored = await findStoredArrangement(user.id);
				expect(stored.ungroupedRoomIds).toEqual([rooms[1].id, rooms[2].id, rooms[0].id]);
			});
		});

		describe('when the user has groups', () => {
			it('should return a 409 conflict', async () => {
				const { loggedInClient, account, user, rooms } = await setupUserWithRooms(2);
				await createGroup(loggedInClient, 'Informatik');
				const storedBefore = await findStoredArrangement(user.id);
				const roomsClient = await roomsApiClient.login(account);

				const response = await roomsClient.patch('', { id: rooms[1].id, toPosition: 0 });

				expect(response.status).toBe(HttpStatus.CONFLICT);
				expect(response.body).toEqual(
					expect.objectContaining({ type: 'ROOM_ARRANGEMENT_CONFLICT', details: { reason: 'LEGACY_MOVE_WITH_GROUPS' } })
				);
				const storedAfter = await findStoredArrangement(user.id);
				expect(storedAfter.revision).toBe(storedBefore.revision);
			});
		});
	});
});
