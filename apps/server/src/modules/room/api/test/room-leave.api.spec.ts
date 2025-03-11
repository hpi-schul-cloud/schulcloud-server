import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing/room-membership-entity.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface/permission.enum';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';

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
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /rooms/:roomId/leave', () => {
		const setupRoomRoles = () => {
			const ownerRole = roleFactory.buildWithId({
				name: RoleName.ROOMOWNER,
				permissions: [
					Permission.ROOM_VIEW,
					Permission.ROOM_EDIT,
					Permission.ROOM_DELETE,
					Permission.ROOM_MEMBERS_ADD,
					Permission.ROOM_MEMBERS_REMOVE,
				],
			});
			const adminRole = roleFactory.buildWithId({
				name: RoleName.ROOMADMIN,
				permissions: [
					Permission.ROOM_VIEW,
					Permission.ROOM_EDIT,
					Permission.ROOM_MEMBERS_ADD,
					Permission.ROOM_MEMBERS_REMOVE,
					Permission.ROOM_LEAVE,
				],
			});
			const viewerRole = roleFactory.buildWithId({
				name: RoleName.ROOMVIEWER,
				permissions: [Permission.ROOM_VIEW],
			});
			return { ownerRole, adminRole, viewerRole };
		};

		const setupRoomWithMembers = async () => {
			const school = schoolEntityFactory.buildWithId();
			const room = roomEntityFactory.buildWithId({ schoolId: school.id });

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherAccount: externalTeacherAccount, teacherUser: externalTeacherUser } =
				UserAndAccountTestFactory.buildTeacher();
			const { teacherUser: inRoomAdmin2 } = UserAndAccountTestFactory.buildTeacher({ school: teacherUser.school });
			const { teacherUser: inRoomAdmin3 } = UserAndAccountTestFactory.buildTeacher({ school: teacherUser.school });
			const { teacherUser: inRoomViewer } = UserAndAccountTestFactory.buildTeacher({ school: teacherUser.school });
			const { teacherUser: outTeacher } = UserAndAccountTestFactory.buildTeacher({ school: teacherUser.school });

			const users = { teacherUser, inRoomAdmin2, inRoomAdmin3, inRoomViewer, outTeacher };

			const { ownerRole, adminRole, viewerRole } = setupRoomRoles();

			const roomUsers = [teacherUser, inRoomAdmin2, inRoomAdmin3].map((user) => {
				return { role: adminRole, user };
			});
			roomUsers.push({ role: viewerRole, user: inRoomViewer });

			const userGroupEntity = groupEntityFactory.buildWithId({
				users: roomUsers,
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
				...Object.values(users),
				externalTeacherAccount,
				externalTeacherUser,
				room,
				roomMemberships,
				teacherAccount,
				userGroupEntity,
				ownerRole,
			]);
			em.clear();

			return { room, ...users, teacherAccount, externalTeacherAccount };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setupRoomWithMembers();
				const response = await testApiClient.patch(`/${room.id}/leave`);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has not the required permissions', () => {
			const setupLoggedInUser = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([teacherAccount, teacherUser]);
				const loggedInClient = await testApiClient.login(teacherAccount);
				return { loggedInClient, teacherUser };
			};

			it('should return forbidden error', async () => {
				const { room } = await setupRoomWithMembers();
				const { loggedInClient } = await setupLoggedInUser();

				const response = await loggedInClient.patch(`/${room.id}/leave`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				const { room, teacherAccount } = await setupRoomWithMembers();
				config.FEATURE_ROOMS_ENABLED = false;

				const loggedInClient = await testApiClient.login(teacherAccount);

				const response = await loggedInClient.patch(`/${room.id}/leave`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required permissions', () => {
			describe('when removing a user from the room', () => {
				it('should return OK', async () => {
					const { room, teacherAccount } = await setupRoomWithMembers();
					const loggedInClient = await testApiClient.login(teacherAccount);

					const response = await loggedInClient.patch(`/${room.id}/leave`);

					expect(response.status).toBe(HttpStatus.OK);
				});
			});

			describe('when removing several users from the room', () => {
				it('should return OK', async () => {
					const { room, teacherAccount } = await setupRoomWithMembers();
					const loggedInClient = await testApiClient.login(teacherAccount);

					const response = await loggedInClient.patch(`/${room.id}/leave`);

					expect(response.status).toBe(HttpStatus.OK);
				});
			});

			describe('when trying to remove a user not in room', () => {
				it('should return OK', async () => {
					const { room, externalTeacherAccount } = await setupRoomWithMembers();
					const loggedInClient = await testApiClient.login(externalTeacherAccount);

					const response = await loggedInClient.patch(`/${room.id}/leave`);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});
	});
});
