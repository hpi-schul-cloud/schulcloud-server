import { EntityManager } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '@modules/room/room.config';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { createRoomWithUserGroup } from '@modules/room/testing/room-with-membership.test.factory';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';

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
		const { roomOwnerRole, roomAdminRole, roomEditorRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
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

		return { usersWithRoomRoles, users, accounts };
	};

	describe('PATCH /rooms/:roomId/members/add', () => {
		describe('when being a room admin', () => {
			const setupRoomWithMembers = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				const { teacherAccount: otherTeacherAccount, teacherUser: otherTeacherUser } =
					UserAndAccountTestFactory.buildTeacher({ school: teacherUser.school });
				const room = roomEntityFactory.buildWithId({ schoolId: teacherUser.school.id });
				const teacherGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
				const studentGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT });
				const externalPersonGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTEXTERNALPERSON });
				const { roomEditorRole, roomAdminRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();

				// TODO: add more than one user
				const userGroupEntity = groupEntityFactory.buildWithId({
					users: [{ role: roomAdminRole, user: teacherUser }],
					type: GroupEntityTypes.ROOM,
					organization: teacherUser.school,
					externalSource: undefined,
				});

				const roomMembership = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: school.id,
				});

				await em
					.persist([
						room,
						roomMembership,
						roomAdminRole,
						roomEditorRole,
						roomViewerRole,
						teacherAccount,
						teacherUser,
						teacherGuestRole,
						studentGuestRole,
						externalPersonGuestRole,
						otherTeacherUser,
						otherTeacherAccount,
						userGroupEntity,
					])
					.flush();
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, room, otherTeacherUser, school };
			};

			describe('when the user is not authenticated', () => {
				it('should return a 401 error', async () => {
					const { room } = await setupRoomWithMembers();

					const response = await testApiClient.patch(`/${room.id}/members/add`);

					expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when the user has not the required permissions', () => {
				const setupLoggedInUser = async (school: SchoolEntity) => {
					const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
					await em.persist([teacherAccount, teacherUser]).flush();

					const loggedInClient = await testApiClient.login(teacherAccount);

					return { loggedInClient };
				};

				it('should return forbidden error', async () => {
					const { room, otherTeacherUser, school } = await setupRoomWithMembers();
					const { loggedInClient } = await setupLoggedInUser(school);

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [otherTeacherUser.id],
					});

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('when the user has the required permissions', () => {
				it('should return OK', async () => {
					const { loggedInClient, room, otherTeacherUser } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [otherTeacherUser.id],
					});

					expect(response.status).toBe(HttpStatus.OK);
				});
			});

			describe('when adding a user from a different school, that is not discoverable', () => {
				it('should throw a 404 error', async () => {
					const { loggedInClient, room } = await setupRoomWithMembers();
					const school = schoolEntityFactory.buildWithId();
					const targetUser = userFactory.buildWithId({ school, discoverable: false });
					await em.persist(targetUser).flush();

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [targetUser.id],
					});

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});
		});

		describe('when being a school admin', () => {
			const setupRoomWithMembers = async () => {
				const school = schoolEntityFactory.buildWithId();
				const { usersWithRoomRoles } = await createRoomUsers(school, [
					RoleName.ROOMOWNER,
					RoleName.ROOMADMIN,
					RoleName.ROOMEDITOR,
					RoleName.ROOMEDITOR,
					RoleName.ROOMVIEWER,
				]);

				const { roomEntity, userGroup, roomMembership } = createRoomWithUserGroup(school, usersWithRoomRoles);
				await em.persist([school, roomEntity, userGroup, roomMembership]).flush();
				em.clear();

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				await em.persist([adminAccount, adminUser]).flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return { loggedInClient, room: roomEntity, school };
			};

			describe('when the member to add is from the same school', () => {
				it('should return OK', async () => {
					const { loggedInClient, room, school } = await setupRoomWithMembers();
					const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school });
					await em.persist([teacherUser, teacherAccount]).flush();

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [teacherUser.id],
					});

					expect(response.status).toBe(HttpStatus.OK);
				});
			});

			describe('when the member to add is from the a different school', () => {
				it('should return FORBIDDEN', async () => {
					const { loggedInClient, room, school } = await setupRoomWithMembers();
					const otherSchool = schoolEntityFactory.buildWithId();

					const { teacherUser, teacherAccount } = UserAndAccountTestFactory.buildTeacher({ school: otherSchool });
					await em.persist([school, teacherUser, teacherAccount]).flush();

					const response = await loggedInClient.patch(`/${room.id}/members/add`, {
						userIds: [teacherUser.id],
					});

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});
	});
});
