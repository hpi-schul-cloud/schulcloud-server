import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	groupEntityFactory,
	roleFactory,
	schoolEntityFactory,
	userFactory,
} from '@shared/testing';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { roomMembershipEntityFactory } from '@src/modules/room-membership/testing/room-membership-entity.factory';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { RoomRolesTestFactory } from '../../testing/room-roles.test.factory';
import { RoomMemberListResponse } from '../dto/response/room-member.response';

describe('Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: ServerConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'rooms');

		config = serverConfig();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.FEATURE_ROOMS_ENABLED = true;
		await em.clearCache('roles-cache-byname-roomeditor');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /rooms/:roomId/members/roles', () => {
		const setupRoomWithMembers = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const targetUser = userFactory.buildWithId({ school: teacherUser.school });
			const room = roomEntityFactory.buildWithId({ schoolId: teacherUser.school.id });
			const teacherGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
			const studentGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT });
			const { roomEditorRole, roomAdminRole, roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [
					{ role: roomOwnerRole, user: teacherUser },
					{ role: roomViewerRole, user: targetUser },
				],
				type: GroupEntityTypes.ROOM,
				organization: teacherUser.school,
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
				teacherUser,
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

			return { loggedInClient, room, targetUser };
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

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				const { loggedInClient, room, targetUser } = await setupRoomWithMembers();
				config.FEATURE_ROOMS_ENABLED = false;

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
					expect.arrayContaining([expect.objectContaining({ userId: targetUser.id, roleName: RoleName.ROOMEDITOR })])
				);
			});
		});
	});
});
