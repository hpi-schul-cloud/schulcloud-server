import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
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
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { type RoomArchivedListResponse } from '../dto/response/room-archived-list.response';
import { type RoomDetailsResponse } from '../dto/response/room-details.response';
import { type RoomListResponse } from '../dto/response/room-list.response';
import { RoomSetup } from './util/room-setup.helper';

describe('Room Controller (API) - archive', () => {
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
		config.featureRoomArchiveEnabled = true;

		await em.clearCache('roles-cache-byname-roomadmin');
		await em.clearCache('roles-cache-byname-roomowner');
		await em.clearCache('roles-cache-byname-teacher');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /rooms/:roomId/archive', () => {
		const setup = async () => {
			const roomSetup = new RoomSetup(em, testApiClient);
			await roomSetup.setup([
				['Owner', 'sameSchool', 'teacher', 'roomowner'],
				['Admin', 'sameSchool', 'teacher', 'roomadmin'],
				['Editor', 'sameSchool', 'teacher', 'roomeditor'],
				['Viewer', 'sameSchool', 'student', 'roomviewer'],
				['Outsider', 'sameSchool', 'teacher', 'none'],
			]);
			return roomSetup;
		};

		it('should return a 401 error when the user is not authenticated', async () => {
			const roomSetup = await setup();

			const response = await testApiClient.patch(`/${roomSetup.room.id}/archive`);

			expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
		});

		it('should return a 403 error when the feature is disabled', async () => {
			const roomSetup = await setup();
			config.featureRoomArchiveEnabled = false;

			const loggedInClient = await roomSetup.loginUser('Owner');
			const response = await loggedInClient.patch(`/${roomSetup.room.id}/archive`);

			expect(response.status).toBe(HttpStatus.FORBIDDEN);
		});

		it('should return a 404 error when the room does not exist', async () => {
			const roomSetup = await setup();
			const loggedInClient = await roomSetup.loginUser('Owner');

			const response = await loggedInClient.patch(`/${new ObjectId().toHexString()}/archive`);

			expect(response.status).toBe(HttpStatus.NOT_FOUND);
		});

		it('should return a 400 error when the room id is not a valid mongo id', async () => {
			const roomSetup = await setup();
			const loggedInClient = await roomSetup.loginUser('Owner');

			const response = await loggedInClient.patch('/42/archive');

			expect(response.status).toBe(HttpStatus.BAD_REQUEST);
		});

		it.each([
			['Owner', HttpStatus.OK],
			['Admin', HttpStatus.FORBIDDEN],
			['Editor', HttpStatus.FORBIDDEN],
			['Viewer', HttpStatus.FORBIDDEN],
			['Outsider', HttpStatus.FORBIDDEN],
		] as [string, HttpStatus][])('when user is %s it should return %d', async (userName, expectedStatus) => {
			const roomSetup = await setup();
			const loggedInClient = await roomSetup.loginUser(userName);

			const response = await loggedInClient.patch(`/${roomSetup.room.id}/archive`);

			expect(response.status).toBe(expectedStatus);
		});

		it('should mark the room as archived', async () => {
			const roomSetup = await setup();
			const loggedInClient = await roomSetup.loginUser('Owner');

			await loggedInClient.patch(`/${roomSetup.room.id}/archive`);

			const getResponse = await loggedInClient.get(roomSetup.room.id);
			expect((getResponse.body as RoomDetailsResponse).isArchived).toBe(true);
		});

		it('should apply the archived state globally for all members, not just the acting user', async () => {
			const roomSetup = await setup();
			const ownerClient = await roomSetup.loginUser('Owner');
			await ownerClient.patch(`/${roomSetup.room.id}/archive`);

			const editorClient = await roomSetup.loginUser('Editor');
			const response = await editorClient.get(roomSetup.room.id);

			expect((response.body as RoomDetailsResponse).isArchived).toBe(true);
		});

		it('should be idempotent when archiving an already archived room', async () => {
			const roomSetup = await setup();
			const loggedInClient = await roomSetup.loginUser('Owner');

			const firstResponse = await loggedInClient.patch(`/${roomSetup.room.id}/archive`);
			const secondResponse = await loggedInClient.patch(`/${roomSetup.room.id}/archive`);

			expect(firstResponse.status).toBe(HttpStatus.OK);
			expect(secondResponse.status).toBe(HttpStatus.OK);

			const getResponse = await loggedInClient.get(roomSetup.room.id);
			expect((getResponse.body as RoomDetailsResponse).isArchived).toBe(true);
		});

		describe('when the room has no owner', () => {
			it('should reject archiving even for a room admin', async () => {
				const roomSetup = new RoomSetup(em, testApiClient);
				await roomSetup.setup([
					['Admin', 'sameSchool', 'teacher', 'roomadmin'],
					['Editor', 'sameSchool', 'teacher', 'roomeditor'],
				]);
				const loggedInClient = await roomSetup.loginUser('Admin');

				const response = await loggedInClient.patch(`/${roomSetup.room.id}/archive`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});
	});

	describe('PATCH /rooms/:roomId/unarchive', () => {
		const setup = async () => {
			const roomSetup = new RoomSetup(em, testApiClient);
			await roomSetup.setup([
				['Owner', 'sameSchool', 'teacher', 'roomowner'],
				['Editor', 'sameSchool', 'teacher', 'roomeditor'],
				['Outsider', 'sameSchool', 'teacher', 'none'],
			]);
			const ownerClient = await roomSetup.loginUser('Owner');
			await ownerClient.patch(`/${roomSetup.room.id}/archive`);

			return { roomSetup, ownerClient };
		};

		it('should return a 401 error when the user is not authenticated', async () => {
			const { roomSetup } = await setup();

			const response = await testApiClient.patch(`/${roomSetup.room.id}/unarchive`);

			expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
		});

		it.each([
			['Owner', HttpStatus.OK],
			['Editor', HttpStatus.FORBIDDEN],
			['Outsider', HttpStatus.FORBIDDEN],
		] as [string, HttpStatus][])('when user is %s it should return %d', async (userName, expectedStatus) => {
			const { roomSetup } = await setup();
			const loggedInClient = await roomSetup.loginUser(userName);

			const response = await loggedInClient.patch(`/${roomSetup.room.id}/unarchive`);

			expect(response.status).toBe(expectedStatus);
		});

		it('should restore the room to active state for all members', async () => {
			const { roomSetup, ownerClient } = await setup();

			await ownerClient.patch(`/${roomSetup.room.id}/unarchive`);

			const editorClient = await roomSetup.loginUser('Editor');
			const response = await editorClient.get(roomSetup.room.id);

			expect((response.body as RoomDetailsResponse).isArchived).toBe(false);
		});

		it('should be idempotent when restoring a room that is not archived', async () => {
			const { roomSetup, ownerClient } = await setup();
			await ownerClient.patch(`/${roomSetup.room.id}/unarchive`);

			const secondResponse = await ownerClient.patch(`/${roomSetup.room.id}/unarchive`);

			expect(secondResponse.status).toBe(HttpStatus.OK);
			const getResponse = await ownerClient.get(roomSetup.room.id);
			expect((getResponse.body as RoomDetailsResponse).isArchived).toBe(false);
		});
	});

	describe('GET /rooms/archived', () => {
		it('should return a 401 error when the user is not authenticated', async () => {
			const response = await testApiClient.get('archived');

			expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
		});

		it('should return a 403 error when the feature is disabled', async () => {
			config.featureRoomArchiveEnabled = false;
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persist([teacherAccount, teacherUser]).flush();
			em.clear();
			const loggedInClient = await testApiClient.login(teacherAccount);

			const response = await loggedInClient.get('archived');

			expect(response.status).toBe(HttpStatus.FORBIDDEN);
		});

		describe('when the user owns an active room and an archived room', () => {
			const setup = async () => {
				const school = schoolEntityFactory.buildWithId();
				const activeRoom = roomEntityFactory.build({ schoolId: school.id, name: 'Active Room' });
				const archivedRoom = roomEntityFactory.build({
					schoolId: school.id,
					name: 'Archived Room',
					archivedAt: new Date(),
				});
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();

				const activeUserGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: roomOwnerRole, user: teacherUser }],
					organization: school,
					externalSource: undefined,
				});
				const archivedUserGroup = groupEntityFactory.buildWithId({
					type: GroupEntityTypes.ROOM,
					users: [{ role: roomOwnerRole, user: teacherUser }],
					organization: school,
					externalSource: undefined,
				});
				const activeMembership = roomMembershipEntityFactory.build({
					userGroupId: activeUserGroup.id,
					roomId: activeRoom.id,
					schoolId: school.id,
				});
				const archivedMembership = roomMembershipEntityFactory.build({
					userGroupId: archivedUserGroup.id,
					roomId: archivedRoom.id,
					schoolId: school.id,
				});

				await em
					.persist([
						activeRoom,
						archivedRoom,
						teacherAccount,
						teacherUser,
						roomOwnerRole,
						activeUserGroup,
						archivedUserGroup,
						activeMembership,
						archivedMembership,
					])
					.flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, activeRoom, archivedRoom };
			};

			it('should return only the archived room', async () => {
				const { loggedInClient, activeRoom, archivedRoom } = await setup();

				const response = await loggedInClient.get('archived');

				expect(response.status).toBe(HttpStatus.OK);
				const body = response.body as RoomArchivedListResponse;
				expect(body.data).toHaveLength(1);
				expect(body.data[0].id).toBe(archivedRoom.id);
				expect(body.data.map((room) => room.id)).not.toContain(activeRoom.id);
			});

			it('should not list the archived room in the normal room overview', async () => {
				const { loggedInClient, activeRoom, archivedRoom } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toBe(HttpStatus.OK);
				const body = response.body as RoomListResponse;
				expect(body.data.map((room) => room.id)).toContain(activeRoom.id);
				expect(body.data.map((room) => room.id)).not.toContain(archivedRoom.id);
			});
		});
	});

	describe('interaction with deletion', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const room = roomEntityFactory.build({ schoolId: school.id, archivedAt: new Date() });
			const { teacherAccount: ownerAccount, teacherUser: ownerUser } = UserAndAccountTestFactory.buildTeacher({
				school,
			});
			const { teacherAccount: editorAccount, teacherUser: editorUser } = UserAndAccountTestFactory.buildTeacher({
				school,
			});
			const { roomOwnerRole, roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
			const userGroup = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [
					{ role: roomOwnerRole, user: ownerUser },
					{ role: roomEditorRole, user: editorUser },
				],
				organization: school,
				externalSource: undefined,
			});
			const roomMembership = roomMembershipEntityFactory.build({
				userGroupId: userGroup.id,
				roomId: room.id,
				schoolId: school.id,
			});

			await em
				.persist([
					room,
					ownerAccount,
					ownerUser,
					editorAccount,
					editorUser,
					roomOwnerRole,
					roomEditorRole,
					userGroup,
					roomMembership,
				])
				.flush();
			em.clear();

			return { room, ownerAccount, editorAccount };
		};

		it('should allow the owner to delete an archived room', async () => {
			const { room, ownerAccount } = await setup();
			const loggedInClient = await testApiClient.login(ownerAccount);

			const response = await loggedInClient.delete(room.id);

			expect(response.status).toBe(HttpStatus.NO_CONTENT);
		});

		it('should reject deletion of an archived room by a non-owner', async () => {
			const { room, editorAccount } = await setup();
			const loggedInClient = await testApiClient.login(editorAccount);

			const response = await loggedInClient.delete(room.id);

			expect(response.status).toBe(HttpStatus.FORBIDDEN);
		});
	});
});
