import { MailService } from '@infra/mail';
import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity/group.entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { SchoolEntity } from '@modules/school/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
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

	let mailServiceSendMock: jest.Mock;

	beforeAll(async () => {
		mailServiceSendMock = jest.fn();

		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(MailService)
			.useValue({
				send: mailServiceSendMock,
			})
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'rooms');
	});

	beforeEach(async () => {
		mailServiceSendMock.mockClear();
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /rooms/:roomId/members/add-by-email', () => {
		const setupRoomWithMembers = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherAccount: otherTeacherAccount, teacherUser: otherTeacherUser } =
				UserAndAccountTestFactory.buildTeacher({ school: teacherUser.school });
			const { account: externalPersonAccount, user: externalPersonUser } =
				UserAndAccountTestFactory.buildByRole('externalPerson');
			externalPersonAccount.username = externalPersonUser.email;
			otherTeacherAccount.username = otherTeacherUser.email;
			otherTeacherUser.discoverable = true;
			const room = roomEntityFactory.buildWithId({ schoolId: teacherUser.school.id });
			const teacherGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
			const studentGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT });
			const externalPersonGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTEXTERNALPERSON });
			const { roomEditorRole, roomAdminRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
			const roomWithExistingExternalPerson = roomEntityFactory.buildWithId({ schoolId: teacherUser.school.id });

			const externalPersonMemberGroupEntity = groupEntityFactory.buildWithId({
				users: [
					{ role: roomAdminRole, user: teacherUser },
					{ role: roomViewerRole, user: externalPersonUser },
				],
				type: GroupEntityTypes.ROOM,
				organization: teacherUser.school,
				externalSource: undefined,
			});

			const userGroupEntity = groupEntityFactory.buildWithId({
				users: [{ role: roomAdminRole, user: teacherUser }],
				type: GroupEntityTypes.ROOM,
				organization: teacherUser.school,
				externalSource: undefined,
			});

			const externalPersonMemberGroupMembership = roomMembershipEntityFactory.build({
				userGroupId: externalPersonMemberGroupEntity.id,
				roomId: roomWithExistingExternalPerson.id,
				schoolId: school.id,
			});

			const roomMembership = roomMembershipEntityFactory.build({
				userGroupId: userGroupEntity.id,
				roomId: room.id,
				schoolId: school.id,
			});

			await em.persistAndFlush([
				room,
				roomWithExistingExternalPerson,
				roomMembership,
				externalPersonMemberGroupMembership,
				roomAdminRole,
				roomEditorRole,
				roomViewerRole,
				teacherAccount,
				teacherUser,
				externalPersonUser,
				externalPersonAccount,
				externalPersonGuestRole,
				teacherGuestRole,
				studentGuestRole,
				otherTeacherUser,
				otherTeacherAccount,
				userGroupEntity,
				externalPersonMemberGroupEntity,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(teacherAccount);

			return { loggedInClient, room, roomWithExistingExternalPerson, otherTeacherUser, externalPersonUser, school };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const { room } = await setupRoomWithMembers();

				const response = await testApiClient.patch(`/${room.id}/members/add-by-email`);

				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has not the required permissions', () => {
			const setupOtherLoggedInUser = async (school: SchoolEntity) => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
				await em.persist([teacherAccount, teacherUser]).flush();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient };
			};

			it('should return forbidden error', async () => {
				const { room, otherTeacherUser, school } = await setupRoomWithMembers();
				const { loggedInClient } = await setupOtherLoggedInUser(school);

				const response = await loggedInClient.patch(`/${room.id}/members/add-by-email`, {
					email: otherTeacherUser.email,
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user has the required permissions', () => {
			describe('when adding an existing external person by email', () => {
				it('should return OK with room role response', async () => {
					const { loggedInClient, room, externalPersonUser } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${room.id}/members/add-by-email`, {
						email: externalPersonUser.email,
					});

					expect(response.status).toBe(HttpStatus.OK);
					expect(response.body).toEqual({ roomRoleName: RoleName.ROOMVIEWER });
				});

				it('should send a mail', async () => {
					const { loggedInClient, room, externalPersonUser } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${room.id}/members/add-by-email`, {
						email: externalPersonUser.email,
					});

					expect(response.status).toBe(HttpStatus.OK);

					expect(mailServiceSendMock).toHaveBeenCalledTimes(1);
				});
			});

			describe('when adding a user with unknown email', () => {
				it('should throw a 404 error', async () => {
					const { loggedInClient, room } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${room.id}/members/add-by-email`, {
						email: 'unknown@example.com',
					});

					expect(response.status).toBe(HttpStatus.NOT_FOUND);
				});
			});

			describe('when adding a user with invalid email format', () => {
				it('should throw a 400 error', async () => {
					const { loggedInClient, room } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${room.id}/members/add-by-email`, {
						email: 'invalid-email-format',
					});

					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					expect((response.body as { message: string }).message).toContain('API validation failed');
				});
			});

			describe('when adding an existing user who is not an external person', () => {
				it('should throw a 400 error', async () => {
					const { loggedInClient, room, otherTeacherUser } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${room.id}/members/add-by-email`, {
						email: otherTeacherUser.email,
					});

					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					expect((response.body as { message: string }).message).toContain('User is not an external person');
				});
			});

			describe('when adding an existing external person who is already member of the room', () => {
				it('should return OK with room role response', async () => {
					const { loggedInClient, roomWithExistingExternalPerson, externalPersonUser } = await setupRoomWithMembers();

					const response = await loggedInClient.patch(`/${roomWithExistingExternalPerson.id}/members/add-by-email`, {
						email: externalPersonUser.email,
					});

					expect(response.status).toBe(HttpStatus.BAD_REQUEST);
					expect((response.body as { message: string }).message).toContain('User is already a member of the room');
				});
			});

			describe('when adding a user with invalid double account (email exists multiple times)', () => {
				const createDuplicateAccount = async (email: string) => {
					const { account: duplicateAccount } = UserAndAccountTestFactory.buildByRole('externalPerson', {
						email,
						username: email,
					});
					await em.persist(duplicateAccount).flush();
				};

				it('should throw a 500 error', async () => {
					const { loggedInClient, room, externalPersonUser } = await setupRoomWithMembers();
					await createDuplicateAccount(externalPersonUser.email);

					const response = await loggedInClient.patch(`/${room.id}/members/add-by-email`, {
						email: externalPersonUser.email,
					});

					expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
					expect((response.body as { message: string }).message).toContain('Invalid data found');
				});
			});
		});
	});
});
