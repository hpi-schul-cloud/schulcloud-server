import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { groupEntityFactory } from '@modules/group/testing/group-entity.factory';
import { RegistrationEntity } from '@modules/registration/repo';
import { registrationEntityFactory } from '@modules/registration/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing/room-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { SchoolPurpose } from '@modules/school/domain';
import { schoolEntityFactory } from '@modules/school/testing';
import { serverConfig, ServerConfig, ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';

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
		testApiClient = new TestApiClient(app, 'registrations');

		config = serverConfig();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /:registrationId/cancel/:roomId', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherAccount: otherTeacherAccount, teacherUser: otherTeacherUser } =
				UserAndAccountTestFactory.buildTeacher({ school });
			const room = roomEntityFactory.buildWithId({ schoolId: teacherUser.school.id });
			const { roomOwnerRole, roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
			const group = groupEntityFactory.buildWithId({
				users: [
					{ user: teacherUser, role: roomOwnerRole },
					{ user: otherTeacherUser, role: roomViewerRole },
				],
				organization: teacherUser.school,
			});
			const roomMembership = roomMembershipEntityFactory.build({
				schoolId: teacherUser.school.id,
				roomId: room.id,
				userGroupId: group.id,
			});

			const externalPersonRole = roleFactory.build({
				name: RoleName.EXTERNALPERSON,
			});

			const guestStudent = roomEntityFactory.build({ name: RoleName.GUESTSTUDENT });
			const guestTeacher = roleFactory.build({ name: RoleName.GUESTTEACHER });
			const guestExternalPerson = roleFactory.build({ name: RoleName.GUESTEXTERNALPERSON });

			const externalPersonsSchool = schoolEntityFactory.build({
				name: 'External Persons School',
				purpose: SchoolPurpose.EXTERNAL_PERSON_SCHOOL,
			});
			await em.persistAndFlush([
				school,
				teacherAccount,
				teacherUser,
				otherTeacherAccount,
				otherTeacherUser,
				room,
				roomOwnerRole,
				roomViewerRole,
				group,
				roomMembership,
				externalPersonRole,
				guestStudent,
				guestTeacher,
				guestExternalPerson,
				externalPersonsSchool,
			]);

			const registration = registrationEntityFactory.build({ roomIds: [room.id] });
			await em.persistAndFlush([registration]);
			em.clear();

			return {
				registration,
				externalPersonRole,
				teacherAccount,
				teacherUser,
				otherTeacherAccount,
				room,
				roomOwnerRole,
			};
		};

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				config.FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED = false;
				const { registration, teacherAccount } = await setup();
				const loggedInClient = await testApiClient.login(teacherAccount);

				const response = await loggedInClient.patch(`/${registration.id}/cancel/${registration.roomIds[0]}`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the registration does not exist', () => {
			it('should return a 404 error', async () => {
				const { teacherAccount } = await setup();
				const loggedInClient = await testApiClient.login(teacherAccount);
				const someNonExistingRegistrationId = new ObjectId().toHexString();
				const someNonExistingRoomId = new ObjectId().toHexString();
				const response = await loggedInClient.patch(
					`/${someNonExistingRegistrationId}/cancel/${someNonExistingRoomId}`
				);

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when the registration exists', () => {
			describe('when the user does not have the required permissions', () => {
				it('should return a 403 error', async () => {
					const { registration, otherTeacherAccount } = await setup();

					const loggedInClient = await testApiClient.login(otherTeacherAccount);

					const response = await loggedInClient.patch(`/${registration.id}/cancel/${registration.roomIds[0]}`);
					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('when the user has the required permissions', () => {
				describe('when the registration is for one room', () => {
					it('should return 200', async () => {
						const { registration, teacherAccount } = await setup();
						const loggedInClient = await testApiClient.login(teacherAccount);

						const response = await loggedInClient.patch(`/${registration.id}/cancel/${registration.roomIds[0]}`);

						expect(response.status).toBe(HttpStatus.OK);
					});

					it('should delete the registration', async () => {
						const { registration, teacherAccount, room } = await setup();
						const loggedInClient = await testApiClient.login(teacherAccount);

						await loggedInClient.patch(`/${registration.id}/cancel/${room.id}`);

						const canceledRegistration = await em.findOne(RegistrationEntity, { id: registration.id });
						expect(canceledRegistration).toBeNull();
					});
				});
			});
		});
	});
});
