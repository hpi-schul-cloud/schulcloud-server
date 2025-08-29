import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { userFactory } from '@modules/user/testing';
import { SchoolEntity } from '@modules/school/repo';

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

	describe('PATCH /rooms/:roomId/members/add', () => {
		const setupRoomWithMembers = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherAccount: otherTeacherAccount, teacherUser: otherTeacherUser } =
				UserAndAccountTestFactory.buildTeacher({ school: teacherUser.school });
			const room = roomEntityFactory.buildWithId({ schoolId: teacherUser.school.id });
			const teacherGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
			const studentGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT });
			const { roomEditorRole, roomAdminRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();

			// TODO: add more than one user
			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role: roomAdminRole, user: teacherUser }],
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
				roomAdminRole,
				roomEditorRole,
				roomViewerRole,
				teacherAccount,
				teacherUser,
				teacherGuestRole,
				studentGuestRole,
				otherTeacherUser,
				otherTeacherAccount,
				userGroupEntity,
			]);
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
				await em.persistAndFlush([teacherAccount, teacherUser]);

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
				await em.persistAndFlush(targetUser);

				const response = await loggedInClient.patch(`/${room.id}/members/add`, {
					userIds: [targetUser.id],
				});

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});
	});
});
