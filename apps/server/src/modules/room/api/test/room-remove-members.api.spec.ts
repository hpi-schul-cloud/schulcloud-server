import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing/room-membership-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { roomEntityFactory } from '../../testing/room-entity.factory';
import { RoomSetup } from './util/room-setup.helper';

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

	describe('PATCH /rooms/:roomId/members/remove', () => {
		const setupRoomWithMembers = async () => {
			const school = schoolEntityFactory.buildWithId();
			const externalSchool = schoolEntityFactory.buildWithId();
			const room = roomEntityFactory.buildWithId({ schoolId: school.id });

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherUser: inRoomOwner } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherUser: inRoomAdmin2 } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherUser: inRoomAdmin3 } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherUser: inRoomViewer } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherUser: outTeacher } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherUser: externalTeacher } = UserAndAccountTestFactory.buildTeacher({ school: externalSchool });

			const users = { teacherUser, inRoomAdmin2, inRoomAdmin3, inRoomOwner, inRoomViewer, outTeacher, externalTeacher };

			const { roomAdminRole, roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();

			const roomUsers = [teacherUser, inRoomAdmin2, inRoomAdmin3].map((user) => {
				return { role: roomAdminRole, user };
			});
			roomUsers.push({ role: roomViewerRole, user: inRoomViewer });
			roomUsers.push({ role: roomOwnerRole, user: inRoomOwner });

			const userGroupEntity = groupEntityFactory.buildWithId({
				users: roomUsers,
				type: GroupEntityTypes.ROOM,
				organization: school,
				externalSource: undefined,
			});

			const roomMemberships = roomMembershipEntityFactory.build({
				userGroupId: userGroupEntity.id,
				roomId: room.id,
				schoolId: school.id,
			});

			await em
				.persist([
					...Object.values(users),
					school,
					externalSchool,
					room,
					roomMemberships,
					teacherAccount,
					userGroupEntity,
					roomAdminRole,
					roomOwnerRole,
					roomViewerRole,
				])
				.flush();
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, room, ...users };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setupRoomWithMembers();
				const response = await testApiClient.patch(`/${room.id}/members/remove`);
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has not the required permissions', () => {
			const setupLoggedInUser = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persist([teacherAccount, teacherUser]).flush();
				const loggedInClient = await testApiClient.login(teacherAccount);
				return { loggedInClient, teacherUser };
			};

			it('should return forbidden error', async () => {
				const { room, inRoomViewer } = await setupRoomWithMembers();
				const { loggedInClient } = await setupLoggedInUser();

				const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds: [inRoomViewer.id] });

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required room permissions', () => {
			describe('when removing a user from the room', () => {
				it('should return OK', async () => {
					const { loggedInClient, room, inRoomAdmin2 } = await setupRoomWithMembers();

					const userIds = [inRoomAdmin2.id];
					const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds });

					expect(response.status).toBe(HttpStatus.OK);
				});
			});

			describe('when removing several users from the room', () => {
				it('should return OK', async () => {
					const { loggedInClient, room, inRoomAdmin2, inRoomAdmin3 } = await setupRoomWithMembers();

					const userIds = [inRoomAdmin2.id, inRoomAdmin3.id];
					const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds });

					expect(response.status).toBe(HttpStatus.OK);
				});
			});

			describe('when trying to remove a user not in room', () => {
				it('should return OK', async () => {
					const { loggedInClient, room, outTeacher } = await setupRoomWithMembers();

					const userIds = [outTeacher.id];
					const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds });

					expect(response.status).toBe(HttpStatus.OK);
				});
			});

			describe('when trying to remove a user of another school', () => {
				it('should return OK', async () => {
					const { loggedInClient, room, externalTeacher } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds: [externalTeacher.id] });

					expect(response.status).toBe(HttpStatus.OK);
				});
			});

			describe('when trying to remove themself', () => {
				it('should return FORBIDDEN', async () => {
					const { loggedInClient, room, teacherUser } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds: [teacherUser.id] });

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('when trying to remove the room owner', () => {
				it('should return FORBIDDEN', async () => {
					const { loggedInClient, room, inRoomOwner } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds: [inRoomOwner.id] });

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});
		});

		describe('when the user is school admin', () => {
			const setupForAdmin = async () => {
				const school = schoolEntityFactory.buildWithId();
				const externalSchool = schoolEntityFactory.buildWithId();
				const room = roomEntityFactory.buildWithId({ schoolId: school.id });

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });
				const { teacherUser: inRoomViewer } = UserAndAccountTestFactory.buildTeacher({ school });
				const { teacherUser: externalTeacher } = UserAndAccountTestFactory.buildTeacher({ school: externalSchool });

				const users = { adminUser, inRoomViewer, externalTeacher };

				const { roomAdminRole, roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();

				const roomUsers = [externalTeacher].map((user) => {
					return { role: roomAdminRole, user };
				});
				roomUsers.push({ role: roomViewerRole, user: inRoomViewer });

				const userGroupEntity = groupEntityFactory.buildWithId({
					users: roomUsers,
					type: GroupEntityTypes.ROOM,
					organization: school,
					externalSource: undefined,
				});

				const roomMemberships = roomMembershipEntityFactory.build({
					userGroupId: userGroupEntity.id,
					roomId: room.id,
					schoolId: school.id,
				});

				await em
					.persist([
						...Object.values(users),
						room,
						externalTeacher,
						roomMemberships,
						adminAccount,
						userGroupEntity,
						roomAdminRole,
						roomOwnerRole,
						roomViewerRole,
					])
					.flush();
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return { loggedInClient, room, ...users, userGroupEntity, roomViewerRole };
			};

			it('should be allowed to remove a member of the same school', async () => {
				const { loggedInClient, room, inRoomViewer } = await setupForAdmin();

				const userIds = [inRoomViewer.id];
				const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds });

				expect(response.status).toBe(HttpStatus.OK);
			});

			it('should not be allowed to remove a user of another school', async () => {
				const { loggedInClient, room, externalTeacher } = await setupForAdmin();

				const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds: [externalTeacher.id] });

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});

			describe('when admin is member in the room', () => {
				describe('when admin is a room viewer', () => {
					it('should be allowed to remove themself', async () => {
						const { loggedInClient, room, adminUser, userGroupEntity, roomViewerRole } = await setupForAdmin();
						userGroupEntity.users.push({ role: roomViewerRole, user: adminUser });
						await em.persist(userGroupEntity).flush();
						em.clear();

						const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds: [adminUser.id] });

						expect(response.status).toBe(HttpStatus.OK);
					});
				});
			});

			describe('when user is school admin', () => {
				describe('when user is also room viewer', () => {
					const setup = async () => {
						const roomSetup = new RoomSetup(em, testApiClient);
						await roomSetup.setup([
							['SameSchoolTeacher_roomowner', 'sameSchool', 'teacher', 'roomowner'],
							['SameSchoolTeacherAdmin_roomviewer', 'sameSchool', ['teacher', 'administrator'], 'roomviewer'],
							['SameSchoolStudent_roomviewer', 'sameSchool', 'student', 'roomviewer'],
							['SameSchoolTeacher_none', 'sameSchool', 'teacher', 'none'],
							['OtherSchoolTeacher_roomeditor', 'otherSchool', 'teacher', 'roomeditor'],
						]);
						return roomSetup;
					};

					it('should be allowed to remove himself', async () => {
						const roomSetup = await setup();
						const { room } = roomSetup;

						const loggedInClient = await roomSetup.loginUser('SameSchoolTeacherAdmin_roomviewer');
						const adminUser = roomSetup.getUserByName('SameSchoolTeacherAdmin_roomviewer');
						const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds: [adminUser.id] });

						expect(response.status).toBe(HttpStatus.OK);
					});
				});

				describe('when user is also the room owner', () => {
					const setup = async () => {
						const roomSetup = new RoomSetup(em, testApiClient);
						await roomSetup.setup([
							['SameSchoolTeacher_roomadmin', 'sameSchool', 'teacher', 'roomadmin'],
							['SameSchoolTeacherAdmin_roomowner', 'sameSchool', ['teacher', 'administrator'], 'roomowner'],
							['SameSchoolStudent_roomviewer', 'sameSchool', 'student', 'roomviewer'],
							['SameSchoolTeacher_none', 'sameSchool', 'teacher', 'none'],
							['OtherSchoolTeacher_roomeditor', 'otherSchool', 'teacher', 'roomeditor'],
						]);
						return roomSetup;
					};

					it('should not be allowed to remove himself', async () => {
						const roomSetup = await setup();
						const { room } = roomSetup;

						const loggedInClient = await roomSetup.loginUser('SameSchoolTeacherAdmin_roomowner');
						const adminUser = roomSetup.getUserByName('SameSchoolTeacherAdmin_roomowner');
						const response = await loggedInClient.patch(`/${room.id}/members/remove`, { userIds: [adminUser.id] });

						expect(response.status).toBe(HttpStatus.FORBIDDEN);
					});
				});
			});
		});
	});
});
