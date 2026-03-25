import { EntityManager } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { accountFactory, defaultTestPasswordHash } from '@modules/account/testing';
import { groupEntityFactory } from '@modules/group/testing/group-entity.factory';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing/room-entity.factory';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { SchoolPurpose } from '@modules/school/domain';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { REGISTRATION_PUBLIC_API_CONFIG_TOKEN, RegistrationPublicApiConfig } from '../../registration.config';
import { registrationEntityFactory } from '../../testing/registration-entity.factory';

const MOCK_PASSWORD = 'password123';
const MOCK_NEW_PASSWORD = 'newPassword123!';

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

	describe('POST /registrations/by-secret/:registrationSecret/complete', () => {
		const setup = async () => {
			const externalPersonsSchool = schoolEntityFactory.build({
				name: 'External Persons School',
				purpose: SchoolPurpose.EXTERNAL_PERSON_SCHOOL,
			});
			const room = roomEntityFactory.buildWithId();
			const group = groupEntityFactory.buildWithId({ users: [] });
			const roomMembership = roomMembershipEntityFactory.build({
				roomId: room.id,
				userGroupId: group.id,
			});
			const externalPersonRole = roleFactory.build({
				name: RoleName.EXTERNALPERSON,
			});
			const { roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
			const guestStudent = roleFactory.build({ name: RoleName.GUESTSTUDENT });
			const guestTeacher = roleFactory.build({ name: RoleName.GUESTTEACHER });
			const guestExternalPerson = roleFactory.build({ name: RoleName.GUESTEXTERNALPERSON });
			await em.persist([roomViewerRole, guestStudent, guestTeacher, guestExternalPerson, externalPersonRole]).flush();

			const registration = registrationEntityFactory.build({ roomIds: [roomMembership.roomId] });
			await em.persist([registration, externalPersonsSchool, roomMembership, group, room]).flush();
			em.clear();

			return { registration, externalPersonRole };
		};

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				config.featureExternalPersonRegistrationEnabled = false;
				const { registration } = await setup();

				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					language: 'en',
					password: MOCK_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the registration exists', () => {
			it('should return 200', async () => {
				const { registration } = await setup();
				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					language: 'en',
					password: MOCK_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.OK);
			});
		});

		describe('when the registration does not exist', () => {
			it('should return a 404 error', async () => {
				const response = await testApiClient.post('/by-secret/someNonExistingSecret/complete', {
					language: 'en',
					password: MOCK_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when testing edge cases', () => {
			it('should handle invalid registration secret format', async () => {
				const response = await testApiClient.post('/by-secret/invalid-format/complete', {
					language: 'en',
					password: MOCK_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});

			it('should handle extremely long registration secret', async () => {
				const longSecret = 'a'.repeat(1000);
				const response = await testApiClient.post(`/by-secret/${longSecret}/complete`, {
					language: 'en',
					password: MOCK_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});

			it('should handle special characters in registration secret', async () => {
				const specialSecret = 'invalid@#$%^&*()';
				const response = await testApiClient.post(`/by-secret/${specialSecret}/complete`, {
					language: 'en',
					password: MOCK_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});

		describe('when testing different language values', () => {
			it('should accept German language', async () => {
				const { registration } = await setup();
				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					language: 'de',
					password: MOCK_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.OK);
			});

			it('should accept Spanish language', async () => {
				const { registration } = await setup();
				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					language: 'es',
					password: MOCK_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.OK);
			});

			it('should handle missing password', async () => {
				const { registration } = await setup();
				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					language: 'en',
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});

			it('should handle missing language', async () => {
				const { registration } = await setup();
				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					password: MOCK_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});

			it('should handle empty payload', async () => {
				const { registration } = await setup();
				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`);

				expect(response.status).toBe(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when a user with the same email already exists', () => {
			const setupWithExistingUser = async () => {
				const externalPersonsSchool = schoolEntityFactory.build({
					name: 'External Persons School',
					purpose: SchoolPurpose.EXTERNAL_PERSON_SCHOOL,
				});
				const roomSchool = schoolEntityFactory.buildWithId({ name: 'Room School' });
				const room = roomEntityFactory.buildWithId({ schoolId: roomSchool.id });
				const group = groupEntityFactory.buildWithId({ users: [] });
				const roomMembership = roomMembershipEntityFactory.build({
					roomId: room.id,
					userGroupId: group.id,
					schoolId: roomSchool.id,
				});
				const externalPersonRole = roleFactory.build({
					name: RoleName.EXTERNALPERSON,
				});
				const { roomViewerRole } = RoomRolesTestFactory.createRoomRoles();
				await em.persist([roomViewerRole, externalPersonRole]).flush();

				const existingUser = userFactory.asExternalPerson().buildWithId({
					school: externalPersonsSchool,
				});

				const existingAccount = accountFactory.buildWithId({
					userId: existingUser.id,
					username: existingUser.email,
					password: defaultTestPasswordHash,
				});

				const registration = registrationEntityFactory.build({
					roomIds: [roomMembership.roomId],
					email: existingUser.email,
					firstName: '',
					lastName: '',
				});

				await em
					.persist([
						registration,
						externalPersonsSchool,
						roomSchool,
						roomMembership,
						group,
						room,
						existingUser,
						existingAccount,
					])
					.flush();
				em.clear();

				return { registration, existingUser, existingAccount };
			};

			it('should not overwrite the existing user firstName and lastName', async () => {
				const { registration, existingUser } = await setupWithExistingUser();

				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					language: 'en',
					password: MOCK_NEW_PASSWORD,
				});

				expect(response.status).toBe(HttpStatus.OK);

				const userAfterCompletion = await em.findOneOrFail(User, existingUser.id);
				expect(userAfterCompletion.firstName).toBe(existingUser.firstName);
				expect(userAfterCompletion.lastName).toBe(existingUser.lastName);
			});

			it('should not overwrite the existing account password', async () => {
				const { registration, existingAccount } = await setupWithExistingUser();
				const passwordBefore = existingAccount.password;

				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					language: 'en',
					password: '',
				});

				expect(response.status).toBe(HttpStatus.OK);

				const accountAfterCompletion = await em.findOneOrFail(AccountEntity, existingAccount.id);
				expect(accountAfterCompletion.password).toBe(passwordBefore);
			});
		});
	});
});
