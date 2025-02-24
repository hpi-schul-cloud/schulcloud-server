import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing/room-membership-entity.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule, serverConfig, type ServerConfig } from '@modules/server';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface/permission.enum';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import { cleanupCollections } from '@testing/cleanup-collections';
import { roleFactory } from '@testing/factory/role.factory';
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
			const editRole = roleFactory.buildWithId({
				name: RoleName.ROOMEDITOR,
				permissions: [Permission.ROOM_VIEW, Permission.ROOM_EDIT],
			});
			const viewerRole = roleFactory.buildWithId({
				name: RoleName.ROOMVIEWER,
				permissions: [Permission.ROOM_VIEW],
			});
			const teacherRole = teacherUser.roles[0];
			const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
			const students = userFactory.buildList(2, { school, roles: [studentRole] });
			const teachers = userFactory.buildList(2, { school, roles: [teacherRole] });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [
					{ role: editRole, user: teacherUser },
					{ role: editRole, user: teachers[0] },
					{ role: editRole, user: teachers[1] },
					{ role: viewerRole, user: students[0] },
					{ role: viewerRole, user: students[1] },
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

			return { loggedInClient, room, students, teachers, teacherUser, viewerRole, editRole };
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
				const { loggedInClient, room, students, teachers, teacherUser, editRole, viewerRole } =
					await setupRoomWithMembers();

				const response = await loggedInClient.get(`/${room.id}/members`);

				expect(response.status).toBe(HttpStatus.OK);
				const body = response.body as RoomMemberListResponse;
				expect(body.data.length).toEqual(5);
				expect(body.data).toContainEqual(
					expect.objectContaining({
						userId: teacherUser.id,
						roomRoleName: editRole.name,
						schoolRoleName: RoleName.TEACHER,
					})
				);
				students.forEach((student) => {
					expect(body.data).toContainEqual(
						expect.objectContaining({
							userId: student.id,
							roomRoleName: viewerRole.name,
							schoolRoleName: RoleName.STUDENT,
						})
					);
				});
				teachers.forEach((teacher) => {
					expect(body.data).toContainEqual(
						expect.objectContaining({
							userId: teacher.id,
							roomRoleName: editRole.name,
							schoolRoleName: RoleName.TEACHER,
						})
					);
				});
			});
		});
	});
});
