import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing/room-membership-entity.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { RoomRolesTestFactory } from '../../testing/room-roles.test.factory';
import { RoomMemberListResponse } from '../dto/response/room-member-list.response';

describe('Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'rooms');
	});

	beforeEach(async () => {
		await cleanupCollections(em);

		await em.clearCache('roles-cache-byname-roomeditor');
		await em.clearCache('roles-cache-byname-teacher');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /rooms/:roomId/members/roles', () => {
		const setupRoomWithMembers = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser: owner } = UserAndAccountTestFactory.buildTeacher({ school });
			const teacherRole = owner.roles[0];
			const targetUser = userFactory.buildWithId({ school: owner.school, roles: [teacherRole] });
			const room = roomEntityFactory.buildWithId({ schoolId: owner.school.id });
			const teacherGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
			const studentGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT });
			const { roomEditorRole, roomAdminRole, roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [
					{ role: roomOwnerRole, user: owner },
					{ role: roomViewerRole, user: targetUser },
				],
				type: GroupEntityTypes.ROOM,
				organization: owner.school,
				externalSource: undefined,
			});

			const roomMemberships = roomMembershipEntityFactory.build({
				userGroupId: userGroupEntity.id,
				roomId: room.id,
				schoolId: school.id,
			});
			await em.persistAndFlush([
				room,
				roomMemberships,
				teacherAccount,
				owner,
				teacherRole,
				teacherGuestRole,
				studentGuestRole,
				roomEditorRole,
				roomAdminRole,
				roomOwnerRole,
				roomViewerRole,
				targetUser,
				targetUser,
				userGroupEntity,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, room, targetUser, owner };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setupRoomWithMembers();

				const response = await testApiClient.patch(`/${room.id}/members/roles`);

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has not the required permissions', () => {
			const setupLoggedInUser = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([teacherAccount, teacherUser]);

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should return forbidden error', async () => {
				const { room, targetUser } = await setupRoomWithMembers();
				const { loggedInClient } = await setupLoggedInUser();

				const response = await loggedInClient.patch(`/${room.id}/members/roles`, {
					userIds: [targetUser.id],
					roleName: RoleName.ROOMEDITOR,
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required permissions', () => {
			it('should return OK', async () => {
				const { loggedInClient, room, targetUser } = await setupRoomWithMembers();

				const response = await loggedInClient.patch(`/${room.id}/members/roles`, {
					userIds: [targetUser.id],
					roleName: RoleName.ROOMEDITOR,
				});

				expect(response.status).toBe(HttpStatus.OK);
			});

			it('should change the role of the user', async () => {
				const { loggedInClient, room, targetUser } = await setupRoomWithMembers();

				await loggedInClient.patch(`/${room.id}/members/roles`, {
					userIds: [targetUser.id],
					roleName: RoleName.ROOMEDITOR,
				});

				const updatedRoomMembership = await loggedInClient.get(`/${room.id}/members`);
				const body = updatedRoomMembership.body as RoomMemberListResponse;
				expect(body.data).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ userId: targetUser.id, roomRoleName: RoleName.ROOMEDITOR }),
					])
				);
			});

			it('should return error when changing someones role to owner', async () => {
				const { loggedInClient, room, targetUser } = await setupRoomWithMembers();

				const response = await loggedInClient.patch(`/${room.id}/members/roles`, {
					userIds: [targetUser.id],
					roleName: RoleName.ROOMOWNER,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});

			it('should return error when changing someones role to a non-room role', async () => {
				const { loggedInClient, room, targetUser } = await setupRoomWithMembers();

				const response = await loggedInClient.patch(`/${room.id}/members/roles`, {
					userIds: [targetUser.id],
					roleName: RoleName.TEACHER,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});

			it('should return error when changing the owners role', async () => {
				const { loggedInClient, room, owner } = await setupRoomWithMembers();

				const response = await loggedInClient.patch(`/${room.id}/members/roles`, {
					userIds: [owner.id],
					roleName: RoleName.ROOMEDITOR,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});
	});
});
