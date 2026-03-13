import { FilterQuery } from '@mikro-orm/core';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { BoardExternalReference, BoardExternalReferenceType } from '@modules/board';
import { BoardNodeEntity } from '@modules/board/repo/entity/board-node.entity';
import { columnBoardEntityFactory } from '@modules/board/testing/entity/column-board-entity.factory';
import { CopyStatus } from '@modules/copy-helper';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomContentType } from '@modules/room/domain';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '@modules/room/room.config';
import { roomContentEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RoomContentEntity, RoomEntity } from '../../repo';
import { roomEntityFactory } from '../../testing/room-entity.factory';

describe('POST /rooms/:roomId/copy', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: RoomPublicApiConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'rooms');

		config = moduleFixture.get<RoomPublicApiConfig>(ROOM_PUBLIC_API_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.featureRoomCopyEnabled = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when the user is not authenticated', () => {
		it('should return a 401 error', async () => {
			const response = await testApiClient.post();
			expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
		});
	});

	describe('when the feature is disabled', () => {
		const setup = async () => {
			config.featureRoomCopyEnabled = false;

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persist([teacherAccount, teacherUser]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient };
		};

		it('should return a 403 error', async () => {
			const { loggedInClient } = await setup();
			const someId = new ObjectId().toHexString();
			const response = await loggedInClient.post(`${someId}/copy`);

			expect(response.status).toBe(HttpStatus.FORBIDDEN);
		});
	});

	describe('when id is not a valid mongo id', () => {
		const setup = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persist([teacherAccount, teacherUser]).flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient };
		};

		it('should return a 400 error', async () => {
			const { loggedInClient } = await setup();
			const response = await loggedInClient.post('42/copy');
			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});
	});

	describe('when the user does not have permission', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
			const { teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

			const room = roomEntityFactory.build();
			const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [
					{ role: roomOwnerRole, user: teacherUser },
					{ role: roomViewerRole, user: studentUser },
				],
			});

			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: userGroup.id,
				schoolId: studentUser.school.id,
			});

			await em
				.persist([
					school,
					room,
					roomViewerRole,
					roomOwnerRole,
					studentAccount,
					studentUser,
					teacherUser,
					userGroup,
					roomMembership,
				])
				.flush();
			em.clear();

			const loggedInClient = await testApiClient.login(studentAccount);
			return { loggedInClient, room };
		};

		it('should return a 403 error', async () => {
			const { loggedInClient, room } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);
			expect(response.status).toBe(HttpStatus.FORBIDDEN);
		});
	});

	describe('when the user has permission', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

			const room = roomEntityFactory.build({ name: 'test', schoolId: school.id });
			const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [{ role: roomOwnerRole, user: teacherUser }],
			});

			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: userGroup.id,
				schoolId: teacherUser.school.id,
			});

			const boards = columnBoardEntityFactory.buildList(2, {
				context: { id: room.id, type: BoardExternalReferenceType.Room },
			});

			const roomContent = roomContentEntityFactory.build({
				roomId: room.id,
				items: [
					{ id: boards[1].id, type: RoomContentType.BOARD },
					{ id: boards[0].id, type: RoomContentType.BOARD },
				],
			});

			await em
				.persist([
					school,
					room,
					roomOwnerRole,
					teacherAccount,
					teacherAccount,
					teacherUser,
					userGroup,
					roomMembership,
					...boards,
					roomContent,
				])
				.flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);
			return { loggedInClient, room, boards, roomContent };
		};

		it('should return a 201 response', async () => {
			const { loggedInClient, room } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);
			expect(response.status).toBe(HttpStatus.CREATED);
		});

		it('should return copy status', async () => {
			const { loggedInClient, room } = await setup();

			const expectedResponse = { status: 'success', title: 'test (1)', type: 'ROOM' };

			const response = await loggedInClient.post(`${room.id}/copy`);
			expect(response.body as CopyStatus).toMatchObject(expectedResponse);
		});

		it('should actually copy the room', async () => {
			const { loggedInClient, room } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);

			const copiedRoomId = (response.body as CopyStatus).id;

			expect(room.id).not.toBe(copiedRoomId);

			const copiedRoom = await em.findOneOrFail(RoomEntity, { id: copiedRoomId });

			expect(copiedRoom).toBeDefined();
		});

		it('should copy the room boards', async () => {
			const { loggedInClient, room, boards } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);

			const copiedRoomId = (response.body as CopyStatus).id;

			const copiedBoards = await em.find(BoardNodeEntity, {
				context: {
					_contextId: new ObjectId(copiedRoomId),
					_contextType: BoardExternalReferenceType.Room,
				} as FilterQuery<BoardExternalReference>,
			});
			expect(copiedBoards.length).toBe(boards.length);
		});

		it('should copy the room content', async () => {
			const { loggedInClient, room, roomContent } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);

			const copiedRoomId = (response.body as CopyStatus).id;

			const copiedContent = await em.findOneOrFail(RoomContentEntity, { roomId: copiedRoomId });

			expect(copiedContent.items.length).toBe(roomContent.items.length);
		});
	});

	describe('when the room name is already taken', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

			const room = roomEntityFactory.build({ name: 'test', schoolId: school.id });
			const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [{ role: roomOwnerRole, user: teacherUser }],
			});

			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: userGroup.id,
				schoolId: teacherUser.school.id,
			});

			await em
				.persist([school, room, roomOwnerRole, teacherAccount, teacherAccount, teacherUser, userGroup, roomMembership])
				.flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);
			return { loggedInClient, room };
		};

		it('should append a number to the copied room name', async () => {
			const { loggedInClient, room } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);

			expect((response.body as CopyStatus).title).toBe('test (1)');
		});
	});

	describe('when the user is from another school', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const room = roomEntityFactory.build({ name: 'test', schoolId: school.id });
			const { roomOwnerRole, roomAdminRole } = RoomRolesTestFactory.createRoomRoles();

			const { teacherAccount: teacherAccountOwner, teacherUser: teacherUserOwner } =
				UserAndAccountTestFactory.buildTeacher({ school: school });

			const otherSchool = schoolEntityFactory.buildWithId();
			const { teacherAccount: teacherAccountExternal, teacherUser: teacherUserExternal } =
				UserAndAccountTestFactory.buildTeacher({ school: otherSchool });

			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [
					{ role: roomAdminRole, user: teacherUserOwner },
					{ role: roomOwnerRole, user: teacherUserExternal },
				],
			});
			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: userGroup.id,
				schoolId: teacherUserOwner.school.id,
			});

			await em
				.persist([
					school,
					otherSchool,
					room,
					roomAdminRole,
					roomOwnerRole,
					teacherAccountOwner,
					teacherUserOwner,
					userGroup,
					roomMembership,
					teacherAccountExternal,
					teacherUserExternal,
				])
				.flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccountExternal);
			return { loggedInClient, room, school, otherSchool };
		};

		it("should copy the room into the user's school", async () => {
			const { loggedInClient, room, otherSchool } = await setup();

			const response = await loggedInClient.post(`${room.id}/copy`);

			const copiedRoomId = (response.body as CopyStatus).id;

			const copiedRoom = await em.findOneOrFail(RoomEntity, { id: copiedRoomId });
			expect(copiedRoom).toBeDefined();
			expect(copiedRoom.schoolId).toEqual(otherSchool.id);
			expect(copiedRoom.schoolId).not.toEqual(room.schoolId);
		});
	});
});
