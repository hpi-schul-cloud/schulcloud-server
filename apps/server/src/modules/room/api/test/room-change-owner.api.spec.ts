import { EntityManager } from '@mikro-orm/mongodb';
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
import { ApiValidationError } from '@shared/common/error';

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

		await em.clearCache('roles-cache-byname-roomadmin');
		await em.clearCache('roles-cache-byname-roomowner');
		await em.clearCache('roles-cache-byname-teacher');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /rooms/:roomId/members/changeowner', () => {
		const setupRoomWithMembers = async () => {
			const school = schoolEntityFactory.buildWithId();
			const otherSchool = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser: owner } = UserAndAccountTestFactory.buildTeacher({ school });
			const teacherRole = owner.roles[0];
			const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
			const student = userFactory.buildWithId({ school: owner.school, roles: [studentRole] });
			const externalTeacherUser = userFactory.buildWithId({ school: otherSchool, roles: [teacherRole] });
			const targetUser = userFactory.buildWithId({ school: owner.school, roles: [teacherRole] });
			const room = roomEntityFactory.buildWithId({ schoolId: owner.school.id });
			const { roomEditorRole, roomAdminRole, roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
			const userGroupEntity = groupEntityFactory.withTypeRoom().buildWithId({
				users: [
					{ role: roomOwnerRole, user: owner },
					{ role: roomViewerRole, user: targetUser },
					{ role: roomViewerRole, user: student },
				],
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
				studentRole,
				student,
				externalTeacherUser,
				teacherRole,
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

			return { loggedInClient, room, targetUser, owner, teacherRole, student, school, externalTeacherUser };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setupRoomWithMembers();

				const response = await testApiClient.patch(`/${room.id}/members/pass-ownership`);

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

				const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
					userId: targetUser.id,
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required permissions', () => {
			it('should return OK', async () => {
				const { loggedInClient, room, targetUser } = await setupRoomWithMembers();

				const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
					userId: targetUser.id,
				});

				expect(response.status).toBe(HttpStatus.OK);
			});

			it('should change the target user to owner', async () => {
				const { loggedInClient, room, targetUser } = await setupRoomWithMembers();

				await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
					userId: targetUser.id,
				});

				const updatedRoomMembership = await loggedInClient.get(`/${room.id}/members`);
				const body = updatedRoomMembership.body as RoomMemberListResponse;
				expect(body.data).toEqual(
					expect.arrayContaining([expect.objectContaining({ userId: targetUser.id, roomRoleName: RoleName.ROOMOWNER })])
				);
			});

			it('should change the current user to admin', async () => {
				const { loggedInClient, room, targetUser, owner } = await setupRoomWithMembers();

				await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
					userId: targetUser.id,
				});

				const updatedRoomMembership = await loggedInClient.get(`/${room.id}/members`);
				const body = updatedRoomMembership.body as RoomMemberListResponse;
				expect(body.data).toEqual(
					expect.arrayContaining([expect.objectContaining({ userId: owner.id, roomRoleName: RoleName.ROOMADMIN })])
				);
			});

			it('should return error when targeting a user that is not in the room', async () => {
				const { loggedInClient, room, owner, teacherRole } = await setupRoomWithMembers();
				const targetUser = userFactory.buildWithId({ school: owner.school, roles: [teacherRole] });
				await em.persistAndFlush(targetUser);

				const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
					userId: targetUser.id,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});

			it('should return error when targeting a user that is a student', async () => {
				const { loggedInClient, room, student } = await setupRoomWithMembers();

				const response = await loggedInClient.patch(`/${room.id}/members/pass-ownership`, {
					userId: student.id,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when the user is a school admin', () => {
			it('should not allow to pick role roomowner (=> different endpoint)', async () => {
				const { room, school, targetUser } = await setupRoomWithMembers();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				await em.persistAndFlush([adminAccount, adminUser]);
				const loggedInClient = await testApiClient.login(adminAccount);

				const response = await loggedInClient.patch(`/${room.id}/members/roles`, {
					userIds: [targetUser.id],
					roleName: RoleName.ROOMOWNER,
				});

				expect(response.body as ApiValidationError).toEqual(
					expect.objectContaining({
						type: 'API_VALIDATION_ERROR',
						validationErrors: expect.arrayContaining([expect.objectContaining({ field: ['roleName'] })]),
					})
				);
			});

			it('should not allow passing ownership to external teachers', async () => {
				const { room, school, externalTeacherUser } = await setupRoomWithMembers();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				await em.persistAndFlush([adminAccount, adminUser]);
				const loggedInClient = await testApiClient.login(adminAccount);

				const response = await loggedInClient.patch(`/${room.id}/members/roles`, {
					userIds: [externalTeacherUser.id],
					roleName: RoleName.ROOMOWNER,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});
	});
});
