import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntity, GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { RoomMembershipEntity } from '@modules/room-membership';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { roomInvitationLinkEntityFactory } from '@modules/room/testing/room-invitation-link-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import type { ServerConfig } from '@modules/server';
import { ServerTestModule, serverConfig } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { ObjectId } from 'mongodb';
import { RoomInvitationLinkValidationError } from '../type/room-invitation-link-validation-error.enum';
import { RoomInvitationLinkError } from '../dto/response/room-invitation-link.error';

type RoomInvitationLinkConfig = {
	requiresConfirmation?: boolean;
	isOnlyForTeachers?: boolean;
	restrictedToCreatorSchool?: boolean;
	activeUntil?: Date;
};

enum UserSchool {
	SAME_SCHOOL = 'SAME_SCHOOL',
	OTHER_SCHOOL = 'OTHER_SCHOOL',
}

enum UserRole {
	STUDENT = 'student',
	TEACHER = 'teacher',
	ADMINISTRATOR = 'administrator',
}

const inOneWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

describe('Room Invitation Link Controller (API)', () => {
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
		testApiClient = new TestApiClient(app, 'room-invitation-links');

		config = serverConfig();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		em.clear();
		config.FEATURE_ROOM_INVITATION_LINKS_ENABLED = true;
		config.FEATURE_ROOMS_CHANGE_PERMISSIONS_ENABLED = true;
		await em.clearCache('roles-cache-byname-roomviewer');
		await em.clearCache('roles-cache-byname-roomapplicant');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /room-invitation-links/:id', () => {
		const setup = async (
			roomInvitationLinkConfig: RoomInvitationLinkConfig,
			roleName: UserRole,
			userSchool: UserSchool
		) => {
			const school = schoolEntityFactory.buildWithId();
			const room = roomEntityFactory.buildWithId({
				schoolId: school.id,
			});
			const otherSchoool = schoolEntityFactory.buildWithId();

			const { user, account } = UserAndAccountTestFactory.buildByRole(roleName, {
				school: userSchool == UserSchool.SAME_SCHOOL ? school : otherSchoool,
			});

			const roomInvitationLink = roomInvitationLinkEntityFactory.buildWithId({
				roomId: room.id,
				requiresConfirmation: roomInvitationLinkConfig.requiresConfirmation ?? false,
				isOnlyForTeachers: roomInvitationLinkConfig.isOnlyForTeachers ?? false,
				restrictedToCreatorSchool: roomInvitationLinkConfig.restrictedToCreatorSchool ?? false,
				activeUntil: roomInvitationLinkConfig.activeUntil ?? inOneWeek,
				creatorUserId: new ObjectId().toHexString(),
				creatorSchoolId: school.id,
			});
			const userGroupEntity = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [],
				organization: user.school,
				externalSource: undefined,
			});
			const roomMembership = roomMembershipEntityFactory.build({
				userGroupId: userGroupEntity.id,
				roomId: room.id,
				schoolId: school.id,
			});
			const { roomApplicantRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
			const teacherGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
			const studentGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT });
			await em.persistAndFlush([
				school,
				user,
				account,
				room,
				roomInvitationLink,
				roomMembership,
				roomViewerRole,
				roomApplicantRole,
				teacherGuestRole,
				studentGuestRole,
				userGroupEntity,
			]);
			em.clear();

			const loggedInClient = await testApiClient.login(account);

			return { loggedInClient, user, account, roomInvitationLink };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post();
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the feature is disabled', () => {
			const setupDisabledFeature = async () => {
				config.FEATURE_ROOM_INVITATION_LINKS_ENABLED = false;

				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return a 403 error', async () => {
				const { loggedInClient } = await setupDisabledFeature();
				const params = {
					title: 'Room invitation link',
					roomId: 'roomId',
					requiresConfirmation: true,
					isOnlyForTeachers: true,
					restrictedToCreatorSchool: true,
					activeUntil: inOneWeek,
				};
				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the user is student', () => {
			describe.each([
				[UserRole.STUDENT, {}, UserSchool.SAME_SCHOOL, HttpStatus.CREATED],
				[UserRole.STUDENT, {}, UserSchool.OTHER_SCHOOL, HttpStatus.FORBIDDEN],
			])('when the user is a %s', (roleName, roomInvitationLinkConfig, fromSameSchool, httpStatus) => {
				const config = JSON.stringify(roomInvitationLinkConfig);
				describe(`when room config is '${config}' and user from '${fromSameSchool}'`, () => {
					it(`should return http status ${httpStatus}`, async () => {
						const { loggedInClient, roomInvitationLink } = await setup(
							roomInvitationLinkConfig,
							roleName,
							fromSameSchool
						);

						const response = await loggedInClient.post(`/${roomInvitationLink.id}`);

						expect(response.status).toBe(httpStatus);
					});
				});
			});
		});

		describe('when the link is vaild', () => {
			it('should return 201 and the roomId', async () => {
				const { loggedInClient, roomInvitationLink } = await setup({}, UserRole.TEACHER, UserSchool.SAME_SCHOOL);

				const response = await loggedInClient.post(`/${roomInvitationLink.id}`);

				expect(response.status).toBe(HttpStatus.CREATED);
				expect(response.body).toEqual({
					id: roomInvitationLink.roomId,
				});
			});
		});

		describe('when the link is only for teachers', () => {
			describe.each([
				[UserRole.TEACHER, { isOnlyForTeachers: true }, UserSchool.SAME_SCHOOL, HttpStatus.CREATED],
				[UserRole.STUDENT, { isOnlyForTeachers: true }, UserSchool.SAME_SCHOOL, HttpStatus.FORBIDDEN],
				[UserRole.TEACHER, { isOnlyForTeachers: false }, UserSchool.SAME_SCHOOL, HttpStatus.CREATED],
				[UserRole.STUDENT, { isOnlyForTeachers: false }, UserSchool.SAME_SCHOOL, HttpStatus.CREATED],
			])('when the user is a %s', (roleName, roomInvitationLinkConfig, fromSameSchool, httpStatus) => {
				const config = JSON.stringify(roomInvitationLinkConfig);
				describe(`when room config is '${config}' and user from '${fromSameSchool}'`, () => {
					it(`should return http status ${httpStatus}`, async () => {
						const { loggedInClient, roomInvitationLink } = await setup(
							roomInvitationLinkConfig,
							roleName,
							fromSameSchool
						);

						const response = await loggedInClient.post(`/${roomInvitationLink.id}`);

						expect(response.status).toBe(httpStatus);
					});
				});
			});
		});

		describe("when the link is restricted to creator's school", () => {
			describe.each([
				[UserRole.TEACHER, { restrictedToCreatorSchool: true }, UserSchool.OTHER_SCHOOL, HttpStatus.FORBIDDEN],
				[UserRole.STUDENT, { restrictedToCreatorSchool: true }, UserSchool.OTHER_SCHOOL, HttpStatus.FORBIDDEN],
				[UserRole.TEACHER, { restrictedToCreatorSchool: false }, UserSchool.OTHER_SCHOOL, HttpStatus.CREATED],
				[UserRole.STUDENT, { restrictedToCreatorSchool: false }, UserSchool.OTHER_SCHOOL, HttpStatus.FORBIDDEN],
			])('when the user is a %s', (roleName, roomInvitationLinkConfig, fromSameSchool, httpStatus) => {
				const config = JSON.stringify(roomInvitationLinkConfig);
				describe(`when room config is '${config}' and user from '${fromSameSchool}'`, () => {
					it(`should return http status ${httpStatus}`, async () => {
						const { loggedInClient, roomInvitationLink } = await setup(
							roomInvitationLinkConfig,
							roleName,
							fromSameSchool
						);

						const response = await loggedInClient.post(`/${roomInvitationLink.id}`);

						expect(response.status).toBe(httpStatus);
					});
				});
			});
		});

		describe('when the link is invalid', () => {
			describe.each([[UserRole.TEACHER, {}, UserSchool.SAME_SCHOOL, HttpStatus.NOT_FOUND]])(
				'when the user is a %s',
				(roleName, roomInvitationLinkConfig, fromSameSchool, httpStatus) => {
					const config = JSON.stringify(roomInvitationLinkConfig);
					describe(`when room config is '${config}' and user from '${fromSameSchool}'`, () => {
						it(`should return http status ${httpStatus}`, async () => {
							const { loggedInClient } = await setup(roomInvitationLinkConfig, roleName, fromSameSchool);

							const linkId = new ObjectId().toHexString();

							const response = await loggedInClient.post(`/${linkId}`);
							const body = response.body as RoomInvitationLinkError;

							expect(response.status).toBe(httpStatus);
							expect(body.details?.validationMessage).toEqual(RoomInvitationLinkValidationError.INVALID_LINK);
						});
					});
				}
			);
		});

		describe('when link requires confirmation', () => {
			describe.each([
				[UserRole.TEACHER, { requiresConfirmation: true }, UserSchool.SAME_SCHOOL, RoleName.ROOMAPPLICANT],
				[UserRole.STUDENT, { requiresConfirmation: true }, UserSchool.SAME_SCHOOL, RoleName.ROOMAPPLICANT],
				[UserRole.TEACHER, { requiresConfirmation: false }, UserSchool.SAME_SCHOOL, RoleName.ROOMVIEWER],
				[UserRole.STUDENT, { requiresConfirmation: false }, UserSchool.SAME_SCHOOL, RoleName.ROOMVIEWER],
			])('when the user is a %s', (roleName, roomInvitationLinkConfig, fromSameSchool, newRole) => {
				const config = JSON.stringify(roomInvitationLinkConfig);
				describe(`when room config is '${config}' and user from '${fromSameSchool}'`, () => {
					it(`should add the user with role: ${newRole}`, async () => {
						const { loggedInClient, roomInvitationLink, user } = await setup(
							roomInvitationLinkConfig,
							roleName,
							fromSameSchool
						);

						await loggedInClient.post(`/${roomInvitationLink.id}`);

						const roomMembership = await em.findOneOrFail(RoomMembershipEntity, {
							roomId: roomInvitationLink.roomId,
						});
						const group = await em.findOneOrFail(GroupEntity, { id: roomMembership.userGroupId });
						const role = await em.findOneOrFail(Role, { name: newRole });

						expect(group.users[0].user.id).toEqual(user.id);
						expect(group.users[0].role.id).toEqual(role.id);
					});
				});
			});

			describe('when the user becomes a room-applicant', () => {
				it('should return 403 and validation error ROOM_APPLICANT_WAITING', async () => {
					const { loggedInClient, roomInvitationLink } = await setup(
						{ requiresConfirmation: true },
						UserRole.TEACHER,
						UserSchool.SAME_SCHOOL
					);

					await loggedInClient.post(`/${roomInvitationLink.id}`);

					const response = await loggedInClient.post(`/${roomInvitationLink.id}`);
					const body = response.body as RoomInvitationLinkError;

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
					expect(body.details?.validationMessage).toEqual(
						RoomInvitationLinkValidationError.ROOM_APPLICANT_WAITING.toString()
					);
				});
			});
		});

		describe('when link activeUntil is set', () => {
			const EXPIRED = { details: { validationMessage: RoomInvitationLinkValidationError.EXPIRED.toString() } };
			const SUCCESS = { id: expect.any(String) };
			const inTheFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
			const inThePast = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
			describe.each([
				[UserRole.TEACHER, { activeUntil: inTheFuture }, UserSchool.SAME_SCHOOL, HttpStatus.CREATED, SUCCESS],
				[UserRole.STUDENT, { activeUntil: inTheFuture }, UserSchool.SAME_SCHOOL, HttpStatus.CREATED, SUCCESS],
				[UserRole.TEACHER, { activeUntil: inThePast }, UserSchool.SAME_SCHOOL, HttpStatus.BAD_REQUEST, EXPIRED],
				[UserRole.STUDENT, { activeUntil: inThePast }, UserSchool.SAME_SCHOOL, HttpStatus.BAD_REQUEST, EXPIRED],
			])('when the user is a %s', (roleName, roomInvitationLinkConfig, fromSameSchool, httpStatus, body) => {
				const config = JSON.stringify(roomInvitationLinkConfig);
				describe(`when room config is '${config}' and user from '${fromSameSchool}'`, () => {
					it(`should return http status ${httpStatus}`, async () => {
						const { loggedInClient, roomInvitationLink } = await setup(
							roomInvitationLinkConfig,
							roleName,
							fromSameSchool
						);

						const response = await loggedInClient.post(`/${roomInvitationLink.id}`);

						expect(response.status).toBe(httpStatus);
						expect(response.body).toEqual(expect.objectContaining(body));
					});
				});
			});
		});

		describe('when user is already member', () => {
			describe.each([
				[UserRole.TEACHER, {}, UserSchool.SAME_SCHOOL, HttpStatus.CREATED],
				[UserRole.STUDENT, {}, UserSchool.SAME_SCHOOL, HttpStatus.CREATED],
				[UserRole.TEACHER, {}, UserSchool.OTHER_SCHOOL, HttpStatus.CREATED],
			])('when the user is a %s', (roleName, roomInvitationLinkConfig, fromSameSchool, httpStatus) => {
				const config = JSON.stringify(roomInvitationLinkConfig);
				describe(`when room config is '${config}' and user from '${fromSameSchool}'`, () => {
					it(`should return http status ${httpStatus}`, async () => {
						const { loggedInClient, roomInvitationLink } = await setup(
							roomInvitationLinkConfig,
							roleName,
							fromSameSchool
						);

						await loggedInClient.post(`/${roomInvitationLink.id}`);

						const response = await loggedInClient.post(`/${roomInvitationLink.id}`);
						expect(response.status).toBe(httpStatus);
					});
				});
			});
		});
	});
});
