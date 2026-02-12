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
import { RegistrationListResponse } from '../dto/response/registration-list.response';

describe('Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: RegistrationPublicApiConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'registrations');

		config = moduleFixture.get<RegistrationPublicApiConfig>(REGISTRATION_PUBLIC_API_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.featureExternalPersonRegistrationEnabled = true;
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
			await em
				.persist([
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
				])
				.flush();

			const registration1 = registrationEntityFactory.build({ roomIds: [room.id] });
			const registration2 = registrationEntityFactory.build({ roomIds: [room.id, new ObjectId().toHexString()] });
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
				roomOwnerRole,
			};
		};

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				config.featureExternalPersonRegistrationEnabled = false;
				const { registration1, teacherAccount } = await setup();
				const loggedInClient = await testApiClient.login(teacherAccount);

				const response = await loggedInClient.patch(`/cancel/${registration1.roomIds[0]}`, {
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
				const response = await loggedInClient.patch(`/cancel/${someNonExistingRoomId}`, {
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

					const response = await loggedInClient.patch(`/cancel/${registration1.roomIds[0]}`, {
						registrationIds: [registration1.id],
					});
					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			describe('when the user has the required permissions', () => {
				describe('when the registration is for one room', () => {
					it('should return 200', async () => {
						const { registration1, teacherAccount } = await setup();
						const loggedInClient = await testApiClient.login(teacherAccount);

						const response = await loggedInClient.patch(`/cancel/${registration1.roomIds[0]}`, {
							registrationIds: [registration1.id],
						});

						expect(response.status).toBe(HttpStatus.OK);
					});

					it('should delete the registration', async () => {
						const { registration1, teacherAccount } = await setup();
						const loggedInClient = await testApiClient.login(teacherAccount);

						await loggedInClient.patch(`/cancel/${registration1.roomIds[0]}`, {
							registrationIds: [registration1.id],
						});
						const canceledRegistration = await em.findOne(RegistrationEntity, { id: registration1.id });
						expect(canceledRegistration).toBeNull();
					});
				});

				describe('when multiple registrations are provided and one has multiple rooms assigned', () => {
					it('should detach only the specified room from the registration and delete the other registration', async () => {
						const { registration1, registration2, teacherAccount, room } = await setup();
						const loggedInClient = await testApiClient.login(teacherAccount);

						const response = await loggedInClient.patch(`/cancel/${registration1.roomIds[0]}`).send({
							registrationIds: [registration1.id, registration2.id],
						});
						const { data } = response.body as RegistrationListResponse;

						expect(response.status).toBe(HttpStatus.OK);
						expect(data).toHaveLength(1);
						expect(data[0].id).toBe(registration2.id);

						const updatedRegistration = await em.findOne(RegistrationEntity, { id: registration2.id });
						expect(updatedRegistration).not.toBeNull();
						expect(updatedRegistration?.roomIds).not.toContain(room.id);

						const deletedRegistration = await em.findOne(RegistrationEntity, { id: registration1.id });
						expect(deletedRegistration).toBeNull();
					});
				});
			});
		});
	});
});
