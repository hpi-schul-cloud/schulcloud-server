import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntity, GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { RoleName } from '@modules/role';
import { Role } from '@modules/role/repo';
import { roleFactory } from '@modules/role/testing';
import { RoomMembershipEntity } from '@modules/room-membership';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { ROOM_PUBLIC_API_CONFIG_TOKEN, RoomPublicApiConfig } from '@modules/room/room.config';
import { roomEntityFactory } from '@modules/room/testing';
import { roomInvitationLinkEntityFactory } from '@modules/room/testing/room-invitation-link-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { ObjectId } from 'mongodb';
import { RoomInvitationLinkError } from '../dto/response/room-invitation-link.error';
import { RoomInvitationLinkValidationError } from '../type/room-invitation-link-validation-error.enum';

type RoomInvitationLinkConfig = {
	requiresConfirmation?: boolean;
	isUsableByExternalPersons?: boolean;
	isUsableByStudents?: boolean;
	restrictedToCreatorSchool?: boolean;
	activeUntil?: Date;
};

enum UserSchool {
	SAME_SCHOOL = 'SAME_SCHOOL',
	OTHER_SCHOOL = 'OTHER_SCHOOL',
}

enum UserRole {
	ADMINISTRATOR = 'administrator',
	EXTERNAL_PERSON = 'externalPerson',
	STUDENT = 'student',
	TEACHER = 'teacher',
}

enum ActiveUntil {
	THE_PAST = 'in the past',
	THE_FUTURE = 'in the future',
}

const Responses = {
	EXPIRED: { details: { validationMessage: RoomInvitationLinkValidationError.EXPIRED.toString() } },
	SUCCESS: { id: expect.any(String) },
};

const inOneWeek = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

describe('Room Invitation Link Controller (API)', () => {
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
		testApiClient = new TestApiClient(app, 'room-invitation-links');

		config = moduleFixture.get<RoomPublicApiConfig>(ROOM_PUBLIC_API_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.featureRoomLinkInvitationExternalPersonsEnabled = true;
		em.clear();
		await em.clearCache('roles-cache-byname-roomviewer');
		await em.clearCache('roles-cache-bynames-roomviewer');
		await em.clearCache('roles-cache-byname-roomapplicant');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /room-invitation-links/:id', () => {
		const setup = async (
			roomInvitationLinkConfig: RoomInvitationLinkConfig,
			roleName: UserRole,
			userSchool: UserSchool,
			previousRole?: RoleName
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
				isUsableByExternalPersons: roomInvitationLinkConfig.isUsableByExternalPersons ?? true,
				isUsableByStudents: roomInvitationLinkConfig.isUsableByStudents ?? true,
				restrictedToCreatorSchool: roomInvitationLinkConfig.restrictedToCreatorSchool ?? false,
				activeUntil: roomInvitationLinkConfig.activeUntil ?? inOneWeek,
				creatorUserId: new ObjectId().toHexString(),
				creatorSchoolId: school.id,
			});
			const { roomApplicantRole, roomViewerRole, roomEditorRole } = RoomRolesTestFactory.createRoomRoles();
			const userGroupEntity = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [],
				organization: user.school,
				externalSource: undefined,
			});
			if (previousRole) {
				const role = [roomApplicantRole, roomViewerRole, roomEditorRole].find((r) => r.name === previousRole);
				if (!role) {
					throw new Error(`Role ${previousRole} not found. Did you forget to create it during setup?`);
				}
				userGroupEntity.users.push({
					user,
					role,
				});
			}
			const roomMembership = roomMembershipEntityFactory.build({
				userGroupId: userGroupEntity.id,
				roomId: room.id,
				schoolId: school.id,
			});
			const teacherGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTTEACHER });
			const studentGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTSTUDENT });
			const externalPersonGuestRole = roleFactory.buildWithId({ name: RoleName.GUESTEXTERNALPERSON });
			await em
				.persist([
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
					externalPersonGuestRole,
					userGroupEntity,
				])
				.flush();
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

		describe('when the link does not exist', () => {
			it('should return http status 404', async () => {
				const { loggedInClient } = await setup({}, UserRole.TEACHER, UserSchool.SAME_SCHOOL);

				const linkId = new ObjectId().toHexString();

				const response = await loggedInClient.post(`/${linkId}`);
				const body = response.body as RoomInvitationLinkError;

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
				expect(body.details?.validationMessage).toEqual(RoomInvitationLinkValidationError.INVALID_LINK);
			});
		});

		describe('when external person link feature is disabled', () => {
			beforeEach(() => {
				config.featureRoomLinkInvitationExternalPersonsEnabled = false;
			});

			describe('when the user is an external person', () => {
				it('should return a 403 error', async () => {
					const { loggedInClient, roomInvitationLink } = await setup(
						{},
						UserRole.EXTERNAL_PERSON,
						UserSchool.SAME_SCHOOL
					);

					const response = await loggedInClient.post(`/${roomInvitationLink.id}`);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('when the user is a teacher', () => {
				it('should return http status 201', async () => {
					const { loggedInClient, roomInvitationLink } = await setup({}, UserRole.TEACHER, UserSchool.SAME_SCHOOL);

					const response = await loggedInClient.post(`/${roomInvitationLink.id}`);

					expect(response.status).toBe(HttpStatus.CREATED);
					expect(response.body).toEqual({
						id: roomInvitationLink.roomId,
					});
				});
			});

			describe('when the user is a student', () => {
				it('should return http status 201', async () => {
					const { loggedInClient, roomInvitationLink } = await setup({}, UserRole.STUDENT, UserSchool.SAME_SCHOOL);

					const response = await loggedInClient.post(`/${roomInvitationLink.id}`);

					expect(response.status).toBe(HttpStatus.CREATED);
					expect(response.body).toEqual({
						id: roomInvitationLink.roomId,
					});
				});
			});
		});

		describe.each([
			[
				UserRole.TEACHER,
				{ isUsableByExternalPersons: false, isUsableByStudents: false },
				UserSchool.SAME_SCHOOL,
				HttpStatus.CREATED,
			],
			[
				UserRole.TEACHER,
				{ isUsableByExternalPersons: true, isUsableByStudents: false },
				UserSchool.SAME_SCHOOL,
				HttpStatus.CREATED,
			],
			[
				UserRole.TEACHER,
				{ isUsableByExternalPersons: false, isUsableByStudents: true },
				UserSchool.SAME_SCHOOL,
				HttpStatus.CREATED,
			],
			[
				UserRole.TEACHER,
				{ isUsableByExternalPersons: true, isUsableByStudents: true },
				UserSchool.SAME_SCHOOL,
				HttpStatus.CREATED,
			],
			[
				UserRole.STUDENT,
				{ isUsableByExternalPersons: false, isUsableByStudents: false },
				UserSchool.SAME_SCHOOL,
				HttpStatus.FORBIDDEN,
			],
			[
				UserRole.STUDENT,
				{ isUsableByExternalPersons: true, isUsableByStudents: false },
				UserSchool.SAME_SCHOOL,
				HttpStatus.FORBIDDEN,
			],
			[
				UserRole.STUDENT,
				{ isUsableByExternalPersons: false, isUsableByStudents: true },
				UserSchool.SAME_SCHOOL,
				HttpStatus.CREATED,
			],
			[
				UserRole.STUDENT,
				{ isUsableByExternalPersons: true, isUsableByStudents: true },
				UserSchool.SAME_SCHOOL,
				HttpStatus.CREATED,
			],
			[
				UserRole.EXTERNAL_PERSON,
				{ isUsableByExternalPersons: false, isUsableByStudents: false },
				UserSchool.SAME_SCHOOL,
				HttpStatus.FORBIDDEN,
			],
			[
				UserRole.EXTERNAL_PERSON,
				{ isUsableByExternalPersons: true, isUsableByStudents: false },
				UserSchool.SAME_SCHOOL,
				HttpStatus.CREATED,
			],
			[
				UserRole.EXTERNAL_PERSON,
				{ isUsableByExternalPersons: false, isUsableByStudents: true },
				UserSchool.SAME_SCHOOL,
				HttpStatus.FORBIDDEN,
			],
			[
				UserRole.EXTERNAL_PERSON,
				{ isUsableByExternalPersons: true, isUsableByStudents: true },
				UserSchool.SAME_SCHOOL,
				HttpStatus.CREATED,
			],
		])('usable by external persons and students', (roleName, roomInvitationLinkConfig, fromSameSchool, httpStatus) => {
			const config = JSON.stringify(roomInvitationLinkConfig);
			describe(`when room config is '${config}' and user is a ${roleName} from '${fromSameSchool}'`, () => {
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

		describe.each([
			[UserRole.TEACHER, { restrictedToCreatorSchool: true }, UserSchool.OTHER_SCHOOL, HttpStatus.FORBIDDEN],
			[UserRole.STUDENT, { restrictedToCreatorSchool: true }, UserSchool.OTHER_SCHOOL, HttpStatus.FORBIDDEN],
			[UserRole.EXTERNAL_PERSON, { restrictedToCreatorSchool: true }, UserSchool.OTHER_SCHOOL, HttpStatus.CREATED],
			[UserRole.TEACHER, { restrictedToCreatorSchool: false }, UserSchool.OTHER_SCHOOL, HttpStatus.CREATED],
			[UserRole.STUDENT, { restrictedToCreatorSchool: false }, UserSchool.OTHER_SCHOOL, HttpStatus.FORBIDDEN],
			[UserRole.EXTERNAL_PERSON, { restrictedToCreatorSchool: false }, UserSchool.OTHER_SCHOOL, HttpStatus.CREATED],
		])('restriction to creators school', (roleName, roomInvitationLinkConfig, fromSameSchool, httpStatus) => {
			const config = JSON.stringify(roomInvitationLinkConfig);
			describe(`when link is '${config}' and user is a '${roleName}' from '${fromSameSchool}'`, () => {
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

		describe.each([
			[UserRole.TEACHER, ActiveUntil.THE_FUTURE, UserSchool.SAME_SCHOOL, HttpStatus.CREATED, Responses.SUCCESS],
			[UserRole.STUDENT, ActiveUntil.THE_FUTURE, UserSchool.SAME_SCHOOL, HttpStatus.CREATED, Responses.SUCCESS],
			[UserRole.TEACHER, ActiveUntil.THE_PAST, UserSchool.SAME_SCHOOL, HttpStatus.BAD_REQUEST, Responses.EXPIRED],
			[UserRole.STUDENT, ActiveUntil.THE_PAST, UserSchool.SAME_SCHOOL, HttpStatus.BAD_REQUEST, Responses.EXPIRED],
		])('expiry date', (roleName, activeUntil, fromSameSchool, httpStatus, body) => {
			const inTheFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
			const inThePast = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
			const roomInvitationLinkConfig = {
				activeUntil: activeUntil === ActiveUntil.THE_FUTURE ? inTheFuture : inThePast,
			};
			describe(`when link expires ${activeUntil} and user is a ${roleName} from '${fromSameSchool}'`, () => {
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

		describe.each([
			{ prevRole: undefined, config: { requiresConfirmation: true }, finalRole: RoleName.ROOMAPPLICANT },
			{ prevRole: undefined, config: { requiresConfirmation: false }, finalRole: RoleName.ROOMVIEWER },
			{ prevRole: RoleName.ROOMAPPLICANT, config: { requiresConfirmation: true }, finalRole: RoleName.ROOMAPPLICANT },
			{ prevRole: RoleName.ROOMAPPLICANT, config: { requiresConfirmation: false }, finalRole: RoleName.ROOMVIEWER },
			{ prevRole: RoleName.ROOMVIEWER, config: { requiresConfirmation: true }, finalRole: RoleName.ROOMVIEWER },
			{ prevRole: RoleName.ROOMVIEWER, config: { requiresConfirmation: false }, finalRole: RoleName.ROOMVIEWER },
			{ prevRole: RoleName.ROOMEDITOR, config: { requiresConfirmation: true }, finalRole: RoleName.ROOMEDITOR },
			{ prevRole: RoleName.ROOMEDITOR, config: { requiresConfirmation: false }, finalRole: RoleName.ROOMEDITOR },
		])('role assignment', ({ prevRole, config, finalRole }) => {
			const configString = JSON.stringify(config);
			const prevRoleString = prevRole || 'not a member';
			describe(`when room config is '${configString}' and user was ${prevRoleString} before`, () => {
				it(`user should get the role: ${finalRole}`, async () => {
					const { loggedInClient, roomInvitationLink, user } = await setup(
						config,
						UserRole.TEACHER,
						UserSchool.SAME_SCHOOL,
						prevRole
					);

					await loggedInClient.post(`/${roomInvitationLink.id}`);

					const roomMembership = await em.findOneOrFail(RoomMembershipEntity, {
						roomId: roomInvitationLink.roomId,
					});
					const group = await em.findOneOrFail(GroupEntity, { id: roomMembership.userGroupId });
					const role = await em.findOneOrFail(Role, { name: finalRole });

					expect(group.users[0].user.id).toEqual(user.id);
					expect(group.users[0].role.id).toEqual(role.id);
				});
			});
		});
	});
});
