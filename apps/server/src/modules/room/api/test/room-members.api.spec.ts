import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing/room-membership-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
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
	});

	afterAll(async () => {
		await app.close();
	});

	describe('GET /rooms/:roomId/members', () => {
		const setupRoomWithExternalMembers = async (
			loginAs: RoleName.ADMINISTRATOR | RoleName.TEACHER | RoleName.EXPERT
		) => {
			const school = schoolEntityFactory.buildWithId();
			const externalSchool = schoolEntityFactory.buildWithId();
			const room = roomEntityFactory.buildWithId();

			const { user: adminUser, account: adminAccount } = UserAndAccountTestFactory.buildByRole(RoleName.ADMINISTRATOR, {
				school,
			});

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { expertAccount, expertUser } = UserAndAccountTestFactory.buildExpert({ school });
			const { roomEditorRole, roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
			const teacherRole = teacherUser.roles[0];
			const studentRole = roleFactory.buildWithId({ name: RoleName.STUDENT });
			const students = userFactory.buildList(2, { school, roles: [studentRole] });
			const externalStudent = userFactory.buildWithId({ school: externalSchool, roles: [studentRole] });
			const teachers = userFactory.buildList(2, { school, roles: [teacherRole] });
			const externalTeachers = userFactory.buildList(2, { school: externalSchool, roles: [teacherRole] });
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [
					{ role: roomEditorRole, user: teacherUser },
					{ role: roomEditorRole, user: teachers[0] },
					{ role: roomEditorRole, user: teachers[1] },
					{ role: roomOwnerRole, user: externalTeachers[0] },
					{ role: roomEditorRole, user: externalTeachers[1] },
					{ role: roomViewerRole, user: students[0] },
					{ role: roomViewerRole, user: students[1] },
					{ role: roomViewerRole, user: externalStudent },
					{ role: roomViewerRole, user: expertUser },
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
				adminAccount,
				adminUser,
				expertAccount,
				expertUser,
				room,
				roomMemberships,
				teacherAccount,
				teacherUser,
				userGroupEntity,
				externalStudent,
				...externalTeachers,
				...students,
				...teachers,
			]);
			em.clear();

			const loginAccount =
				loginAs === RoleName.ADMINISTRATOR
					? adminAccount
					: loginAs === RoleName.EXPERT
					? expertAccount
					: teacherAccount;

			const loggedInClient = await testApiClient.login(loginAccount);

			return {
				loggedInClient,
				room,
				students,
				teachers,
				adminUser,
				expertUser,
				teacherUser,
				externalStudent,
				externalTeachers,
				roomEditorRole,
				roomOwnerRole,
				roomViewerRole,
			};
		};

		const setupInsufficientPermissionsUser = async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			await em.persistAndFlush([teacherAccount, teacherUser]);
			const loggedInClient = await testApiClient.login(teacherAccount);
			return { loggedInClient };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setupRoomWithExternalMembers(RoleName.TEACHER);
				const response = await testApiClient.get(`/${room.id}/members`);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has not the required permissions', () => {
			it('should return forbidden error', async () => {
				const { room } = await setupRoomWithExternalMembers(RoleName.TEACHER);
				const { loggedInClient } = await setupInsufficientPermissionsUser();

				const response = await loggedInClient.get(`/${room.id}/members`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user can fully access room members', () => {
			it('should return real names for all members', async () => {
				const {
					loggedInClient,
					room,
					students,
					teachers,
					externalStudent,
					externalTeachers,
					expertUser,
					teacherUser,
					roomEditorRole,
					roomOwnerRole,
					roomViewerRole,
				} = await setupRoomWithExternalMembers(RoleName.TEACHER);

				const response = await loggedInClient.get(`/${room.id}/members`);

				expect(response.status).toBe(HttpStatus.OK);
				const body = response.body as RoomMemberListResponse;
				expect(body.data.length).toEqual(9);
				expect(body.data).toContainEqual(
					expect.objectContaining({
						firstName: teacherUser.firstName,
						lastName: teacherUser.lastName,
						userId: teacherUser.id,
						roomRoleName: roomEditorRole.name,
						schoolRoleNames: [RoleName.TEACHER],
					})
				);
				students.forEach((student) => {
					expect(body.data).toContainEqual(
						expect.objectContaining({
							firstName: student.firstName,
							lastName: student.lastName,
							userId: student.id,
							roomRoleName: roomViewerRole.name,
							schoolRoleNames: [RoleName.STUDENT],
						})
					);
				});
				teachers.forEach((teacher) => {
					expect(body.data).toContainEqual(
						expect.objectContaining({
							firstName: teacher.firstName,
							lastName: teacher.lastName,
							userId: teacher.id,
							roomRoleName: roomEditorRole.name,
							schoolRoleNames: [RoleName.TEACHER],
						})
					);
				});
				const externalStudentMember = body.data.find((member) => member.userId === externalStudent.id);
				expect(externalStudentMember).toEqual(
					expect.objectContaining({
						firstName: externalStudent.firstName,
						lastName: externalStudent.lastName,
						userId: externalStudent.id,
						roomRoleName: roomViewerRole.name,
						schoolRoleNames: [RoleName.STUDENT],
					})
				);
				const externalTeacherMemberOne = body.data.find((member) => member.userId === externalTeachers[0].id);
				expect(externalTeacherMemberOne).toEqual(
					expect.objectContaining({
						firstName: externalTeachers[0].firstName,
						lastName: externalTeachers[0].lastName,
						userId: externalTeachers[0].id,
						roomRoleName: roomOwnerRole.name,
						schoolRoleNames: [RoleName.TEACHER],
					})
				);
				const externalTeacherMemberTwo = body.data.find((member) => member.userId === externalTeachers[1].id);
				expect(externalTeacherMemberTwo).toEqual(
					expect.objectContaining({
						firstName: externalTeachers[1].firstName,
						lastName: externalTeachers[1].lastName,
						userId: externalTeachers[1].id,
						roomRoleName: roomEditorRole.name,
						schoolRoleNames: [RoleName.TEACHER],
					})
				);
				const expertMember = body.data.find((member) => member.userId === expertUser.id);
				expect(expertMember).toEqual(
					expect.objectContaining({
						firstName: expertUser.firstName,
						lastName: expertUser.lastName,
						userId: expertUser.id,
						roomRoleName: roomViewerRole.name,
						schoolRoleNames: [RoleName.EXPERT],
					})
				);
			});
		});

		describe('when the user is external and has no right to access room members', () => {
			it('should return forbidden', async () => {
				const { loggedInClient, room } = await setupRoomWithExternalMembers(RoleName.EXPERT);

				const response = await loggedInClient.get(`/${room.id}/members`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Forbidden',
					type: 'FORBIDDEN',
				});
			});
		});

		describe('when the user can only administrate school rooms', () => {
			it('should return forbidden', async () => {
				const { loggedInClient, room } = await setupRoomWithExternalMembers(RoleName.ADMINISTRATOR);

				const response = await loggedInClient.get(`/${room.id}/members`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual({
					code: HttpStatus.FORBIDDEN,
					message: 'Forbidden',
					title: 'Forbidden',
					type: 'FORBIDDEN',
				});
			});
		});
	});
});
