import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing/room-membership-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { RoomMemberListResponse } from '../dto/response/room-member-list.response';

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

	describe('GET /rooms/:roomId/members', () => {
		const setupRoomWithMembers = async () => {
			const school = schoolEntityFactory.buildWithId();
			const room = roomEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
			const teacherRole = teacherUser.roles[0];
			const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
			const students = userFactory.buildList(2, { school, roles: [studentRole] });
			const teachers = userFactory.buildList(2, { school, roles: [teacherRole] });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [
					{ role: roomEditorRole, user: teacherUser },
					{ role: roomEditorRole, user: teachers[0] },
					{ role: roomEditorRole, user: teachers[1] },
					{ role: roomViewerRole, user: students[0] },
					{ role: roomViewerRole, user: students[1] },
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
				userGroupEntity,
				...students,
				...teachers,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, room, students, teachers, teacherUser, roomViewerRole, roomEditorRole };
		};

		const setupLoggedInUser = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([teacherAccount, teacherUser]);
			const loggedInClient = await testApiClient.login(teacherAccount);
			return { loggedInClient };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setupRoomWithMembers();
				const response = await testApiClient.get(`/${room.id}/members`);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has not the required permissions', () => {
			it('should return forbidden error', async () => {
				const { room } = await setupRoomWithMembers();
				const { loggedInClient } = await setupLoggedInUser();

				const response = await loggedInClient.get(`/${room.id}/members`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				const { loggedInClient, room } = await setupRoomWithMembers();
				config.FEATURE_ROOMS_ENABLED = false;

				const response = await loggedInClient.get(`/${room.id}/members`);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required permissions', () => {
			it('should return a list of members', async () => {
				const { loggedInClient, room, students, teachers, teacherUser, roomEditorRole, roomViewerRole } =
					await setupRoomWithMembers();

				const response = await loggedInClient.get(`/${room.id}/members`);

				expect(response.status).toBe(HttpStatus.OK);
				const body = response.body as RoomMemberListResponse;
				expect(body.data.length).toEqual(5);
				expect(body.data).toContainEqual(
					expect.objectContaining({
						userId: teacherUser.id,
						roomRoleName: roomEditorRole.name,
						schoolRoleNames: [RoleName.TEACHER],
					})
				);
				students.forEach((student) => {
					expect(body.data).toContainEqual(
						expect.objectContaining({
							userId: student.id,
							roomRoleName: roomViewerRole.name,
							schoolRoleNames: [RoleName.STUDENT],
						})
					);
				});
				teachers.forEach((teacher) => {
					expect(body.data).toContainEqual(
						expect.objectContaining({
							userId: teacher.id,
							roomRoleName: roomEditorRole.name,
							schoolRoleNames: [RoleName.TEACHER],
						})
					);
				});
			});
		});
	});
});
