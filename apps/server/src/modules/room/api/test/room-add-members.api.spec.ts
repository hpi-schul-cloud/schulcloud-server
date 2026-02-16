import { EntityManager } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { GroupEntity } from '@modules/group/entity/group.entity';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '@modules/room/room.config';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { createRoomWithUserGroup } from '@modules/room/testing/room-with-membership.test.factory';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { User } from '@modules/user/repo';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';

describe('Room Controller (API)', () => {
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
		config.featureRoomLinkInvitationExternalPersonsEnabled = true;
	});

	afterAll(async () => {
		await app.close();
	});

	const createRoomUsers = async (school: SchoolEntity, roomRoleNames: Array<RoleName>) => {
		const roomRoles = RoomRolesTestFactory.createRoomRoles();
		const { roomOwnerRole, roomAdminRole, roomEditorRole, roomViewerRole } = roomRoles;
		const roles = [roomOwnerRole, roomAdminRole, roomEditorRole, roomViewerRole];
		await em.persist(roles).flush();

		const usersWithRoomRoles: Array<{ role: Role; user: User }> = [];
		const users: User[] = [];
		const accounts: AccountEntity[] = [];
		for (const roleName of roomRoleNames) {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const role = roles.find((r) => r.name === roleName);
			if (!role) {
				throw new Error(`Role with name ${roleName} not found`);
			}
			usersWithRoomRoles.push({ role, user: teacherUser });
			await em.persist([teacherUser, teacherAccount]).flush();
			users.push(teacherUser);
			accounts.push(teacherAccount);
		}
		em.clear();

		return { usersWithRoomRoles, users, accounts, roomRoles };
	};

	describe('PATCH /rooms/:roomId/members/add', () => {
		const setupRoomWithMembers = async (
			options: { additionalMembers: { user: User; role: Role }[] } = { additionalMembers: [] }
		) => {
			const school = schoolEntityFactory.buildWithId();
			const { usersWithRoomRoles, roomRoles } = await createRoomUsers(school, [
				RoleName.ROOMOWNER,
				RoleName.ROOMADMIN,
				RoleName.ROOMEDITOR,
				RoleName.ROOMEDITOR,
				RoleName.ROOMVIEWER,
			]);

			const guestStudentRole = roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT });
			const guestTeacherRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
			const guestExternalPersonRole = roleFactory.buildWithId({ name: RoleName.GUESTEXTERNALPERSON });
			await em.persist([guestStudentRole, guestTeacherRole, guestExternalPersonRole]).flush();
			usersWithRoomRoles.push(...options.additionalMembers);

			const { roomEntity, userGroup, roomMembership } = createRoomWithUserGroup(school, usersWithRoomRoles);
			await em.persist([school, roomEntity, userGroup, roomMembership]).flush();
			em.clear();

			return { room: roomEntity, school, roomRoles, userGroup };
		};

		describe('when being a room admin', () => {
			const loginAsTeacher = async (school: SchoolEntity) => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				await em.persist([teacherAccount, teacherUser]).flush();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, teacherUser };
			};

			it.each([
				['student', 'same school', '', HttpStatus.OK],
				['student', 'other school', '', HttpStatus.FORBIDDEN],
				['teacher', 'same school', 'and is discoverable', HttpStatus.OK],
				['teacher', 'same school', 'and is not discoverable', HttpStatus.OK],
				['teacher', 'other school', 'and is discoverable', HttpStatus.OK],
				['teacher', 'other school', 'and is not discoverable', HttpStatus.FORBIDDEN],
				['externalPerson', 'same school', '', HttpStatus.OK],
			])(
				'when the new member is a %s of %s %s, it should return %i',
				async (loggedInRole, newMemberSchool, discoverable, httpStatus) => {
					const { room, school, userGroup, roomRoles } = await setupRoomWithMembers();
					const { loggedInClient, teacherUser } = await loginAsTeacher(school);
					const otherSchool = schoolEntityFactory.buildWithId();
					userGroup.users.push({ role: roomRoles.roomAdminRole, user: teacherUser });
					await em.persist(userGroup).flush();

					const newUserSchool = newMemberSchool === 'same school' ? school : otherSchool;
					const { user, account } = UserAndAccountTestFactory.buildByRole(loggedInRole as 'student' | 'teacher', {
						school: newUserSchool,
						...(discoverable === 'and is discoverable' ? { discoverable: true } : {}),
					});
					await em.persist([user, account]).flush();

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [user.id],
					});

					expect(response.status).toBe(httpStatus);
				}
			);

			describe('when the user is not authenticated', () => {
				it('should return a 401 error', async () => {
					const { room } = await setupRoomWithMembers();

					const response = await testApiClient.patch(`/${room.id}/members/add`);

					expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when trying to add invalid user ids', () => {
				it('should return 404 error', async () => {
					const { room, school, userGroup, roomRoles } = await setupRoomWithMembers();
					const { loggedInClient, teacherUser } = await loginAsTeacher(school);
					userGroup.users.push({ role: roomRoles.roomAdminRole, user: teacherUser });
					await em.persist(userGroup).flush();

					const imaginaryUserId = '507f1f77bcf86cd799439011';

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [imaginaryUserId],
					});

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});

			describe('when trying to add users that are already members', () => {
				it('should return 200 and not add duplicate members', async () => {
					const { room, school, userGroup, roomRoles } = await setupRoomWithMembers();
					const { loggedInClient, teacherUser } = await loginAsTeacher(school);
					userGroup.users.push({ role: roomRoles.roomAdminRole, user: teacherUser });
					await em.persist(userGroup).flush();

					const existingMember = userGroup.users[0].user;

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [existingMember.id],
					});

					expect(response.status).toBe(HttpStatus.OK);

					const refreshedUserGroup = await em.findOneOrFail(GroupEntity, userGroup.id, {
						populate: ['users'],
					});
					expect(refreshedUserGroup.users.length).toBe(userGroup.users.length);
				});
			});
		});

		describe('when being a school admin', () => {
			const loginAsAdmin = async (school: SchoolEntity) => {
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				await em.persist([adminAccount, adminUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);
				return { loggedInClient, adminUser };
			};

			it.each([
				['student', 'same school', '', HttpStatus.FORBIDDEN],
				['student', 'other school', '', HttpStatus.FORBIDDEN],
				['teacher', 'same school', 'and is discoverable', HttpStatus.OK],
				['teacher', 'same school', 'and is not discoverable', HttpStatus.OK],
				['teacher', 'other school', 'and is discoverable', HttpStatus.OK],
				['teacher', 'other school', 'and is not discoverable', HttpStatus.FORBIDDEN],
				['externalPerson', 'same school', '', HttpStatus.FORBIDDEN],
			])(
				'when the new member is a %s of %s %s, it should return %i',
				async (loggedInRole, newMemberSchool, discoverable, httpStatus) => {
					const { room, school } = await setupRoomWithMembers();
					const { loggedInClient } = await loginAsAdmin(school);
					const otherSchool = schoolEntityFactory.buildWithId();

					const newUserSchool = newMemberSchool === 'same school' ? school : otherSchool;
					const { user, account } = UserAndAccountTestFactory.buildByRole(loggedInRole as 'student' | 'teacher', {
						school: newUserSchool,
						...(discoverable === 'and is discoverable' ? { discoverable: true } : {}),
					});
					await em.persist([user, account]).flush();

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [user.id],
					});

					expect(response.status).toBe(httpStatus);
				}
			);

			describe('when trying to add himself to a room of own school', () => {
				it('should return 200', async () => {
					const { room, school } = await setupRoomWithMembers();
					const { loggedInClient, adminUser } = await loginAsAdmin(school);

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [adminUser.id],
					});

					expect(response.status).toBe(HttpStatus.OK);
				});
			});
		});

		describe('when being a teacher and school admin', () => {
			const loginAsTeacherAndAdmin = async (school: SchoolEntity) => {
				const { account, user } = UserAndAccountTestFactory.buildTeacherAndAdmin({ school });
				await em.persist([account, user]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(account);
				return loggedInClient;
			};

			it.each([
				['student', 'same school', '', HttpStatus.OK],
				['student', 'other school', '', HttpStatus.FORBIDDEN],
				['teacher', 'same school', 'and is discoverable', HttpStatus.OK],
				['teacher', 'same school', 'and is not discoverable', HttpStatus.OK],
				['teacher', 'other school', 'and is discoverable', HttpStatus.OK],
				['teacher', 'other school', 'and is not discoverable', HttpStatus.FORBIDDEN],
				['externalPerson', 'same school', '', HttpStatus.OK],
			])(
				'when the new member is a %s of %s %s, it should return %i',
				async (loggedInRole, newMemberSchool, discoverable, httpStatus) => {
					const { room, school } = await setupRoomWithMembers();
					const loggedInClient = await loginAsTeacherAndAdmin(school);
					const otherSchool = schoolEntityFactory.buildWithId();

					const newUserSchool = newMemberSchool === 'same school' ? school : otherSchool;
					const { user, account } = UserAndAccountTestFactory.buildByRole(loggedInRole as 'student' | 'teacher', {
						school: newUserSchool,
						...(discoverable === 'and is discoverable' ? { discoverable: true } : {}),
					});
					await em.persist([user, account]).flush();

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [user.id],
					});

					expect(response.status).toBe(httpStatus);
				}
			);
		});
	});
});
