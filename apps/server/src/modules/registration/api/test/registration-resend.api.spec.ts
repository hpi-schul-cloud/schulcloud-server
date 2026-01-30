import { MailService } from '@infra/mail';
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
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig } from '../../registration.config';

describe('Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: RegistrationPublicApiConfig;

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
		testApiClient = new TestApiClient(app, 'registrations');

		config = moduleFixture.get<RegistrationPublicApiConfig>(REGISTRATION_PUBLIC_API_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		mailServiceSendMock.mockClear();
		await cleanupCollections(em);
		config.featureExternalPersonRegistrationEnabled = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /:registrationId/resend-mail/:roomId', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { teacherAccount: otherTeacherAccount, teacherUser: otherTeacherUser } =
				UserAndAccountTestFactory.buildTeacher({ school });
			const room = roomEntityFactory.buildWithId({ schoolId: teacherUser.school.id });
			const room2 = roomEntityFactory.buildWithId({ schoolId: teacherUser.school.id });
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
			await em
				.persist([
					school,
					teacherAccount,
					teacherUser,
					otherTeacherAccount,
					otherTeacherUser,
					room,
					room2,
					roomOwnerRole,
					roomViewerRole,
					group,
					roomMembership,
					externalPersonRole,
					guestStudent,
					guestTeacher,
					guestExternalPerson,
					externalPersonsSchool,
				])
				.flush();

			const registration1 = registrationEntityFactory.build({ roomIds: [room.id], resentAt: undefined });
			const registration2 = registrationEntityFactory.build({
				roomIds: [room.id, room2.id],
			});
			await em.persist([registration1, registration2]).flush();
			em.clear();

			return {
				registration1,
				registration2,
				externalPersonRole,
				teacherAccount,
				teacherUser,
				otherTeacherAccount,
				room,
				room2,
				roomOwnerRole,
			};
		};

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				config.featureExternalPersonRegistrationEnabled = false;
				const { registration1, teacherAccount } = await setup();
				const loggedInClient = await testApiClient.login(teacherAccount);

				const response = await loggedInClient.patch(`/resend-mail/${registration1.roomIds[0]}`, {
					registrationIds: [registration1.id],
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the registration does not exist', () => {
			it('should return a 404 error', async () => {
				const { teacherAccount } = await setup();
				const loggedInClient = await testApiClient.login(teacherAccount);
				const someNonExistingRegistrationId = new ObjectId().toHexString();
				const someNonExistingRoomId = new ObjectId().toHexString();
				const response = await loggedInClient.patch(`/resend-mail/${someNonExistingRoomId}`, {
					registrationIds: [someNonExistingRegistrationId],
				});

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when the registration exists', () => {
			describe('when the user does not have the required permissions', () => {
				it('should return a 403 error', async () => {
					const { registration1, otherTeacherAccount } = await setup();

					const loggedInClient = await testApiClient.login(otherTeacherAccount);

					const response = await loggedInClient.patch(`/resend-mail/${registration1.roomIds[0]}`, {
						registrationIds: [registration1.id],
					});
					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('when the user has the required permissions', () => {
				describe('when the registration is for one room', () => {
					it('should return 200 and update registration', async () => {
						const { registration1, teacherAccount } = await setup();
						const loggedInClient = await testApiClient.login(teacherAccount);

						expect(registration1.resentAt).toBeUndefined();

						const response = await loggedInClient.patch(`/resend-mail/${registration1.roomIds[0]}`, {
							registrationIds: [registration1.id],
						});
						const updatedRegistration = await em.findOne(RegistrationEntity, { id: registration1.id });

						expect(response.status).toBe(HttpStatus.OK);
						expect(updatedRegistration?.resentAt).toBeDefined();
					});

					it('should resend a mail', async () => {
						const { registration1, teacherAccount, room } = await setup();
						const loggedInClient = await testApiClient.login(teacherAccount);

						await loggedInClient.patch(`/resend-mail/${room.id}`, {
							registrationIds: [registration1.id],
						});

						expect(mailServiceSendMock).toHaveBeenCalledTimes(1);
					});
				});

				describe('when multiple registrations are resent', () => {
					describe('and one of the registrations was resent within last two minutes', () => {
						it('should return 200 and update registrations', async () => {
							const { registration1, teacherAccount } = await setup();
							const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
							const anotherRegistration = registrationEntityFactory.build({
								roomIds: [registration1.roomIds[0]],
								resentAt: oneMinuteAgo,
							});
							await em.persist(anotherRegistration).flush();
							const loggedInClient = await testApiClient.login(teacherAccount);

							expect(registration1.resentAt).toBeUndefined();
							expect(anotherRegistration.resentAt).toEqual(oneMinuteAgo);

							const response = await loggedInClient.patch(`/resend-mail/${registration1.roomIds[0]}`, {
								registrationIds: [registration1.id, anotherRegistration.id],
							});
							const updatedRegistration = await em.findOne(RegistrationEntity, { id: registration1.id });
							const notUpdatedAnotherRegistration = await em.findOne(RegistrationEntity, {
								id: anotherRegistration.id,
							});

							expect(response.status).toBe(HttpStatus.OK);
							expect(updatedRegistration?.resentAt).toEqual(expect.any(Date));
							expect(notUpdatedAnotherRegistration).toEqual(anotherRegistration);
						});

						it('should resend multiple mails', async () => {
							const { registration1, registration2, teacherAccount, room } = await setup();
							const loggedInClient = await testApiClient.login(teacherAccount);

							await loggedInClient.patch(`/resend-mail/${room.id}`, {
								registrationIds: [registration1.id, registration2.id],
							});

							expect(mailServiceSendMock).toHaveBeenCalledTimes(2);
						});
					});
				});
			});
		});
	});
});
