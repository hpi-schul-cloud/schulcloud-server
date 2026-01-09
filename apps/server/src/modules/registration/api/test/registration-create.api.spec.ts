import { MailService } from '@infra/mail';
import { EntityManager } from '@mikro-orm/mongodb';
import { GroupEntityTypes } from '@modules/group/entity';
import { groupEntityFactory } from '@modules/group/testing';
import { registrationEntityFactory } from '@modules/registration/testing';
import { roomMembershipEntityFactory } from '@modules/room-membership/testing';
import { roomEntityFactory } from '@modules/room/testing';
import { RoomRolesTestFactory } from '@modules/room/testing/room-roles.test.factory';
import { schoolEntityFactory } from '@modules/school/testing';
import { serverConfig, ServerConfig, ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RegistrationEntity } from '../../repo';
import { CreateOrUpdateRegistrationBodyParams } from '../dto/request/create-registration.body.params';

describe('Registration Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: ServerConfig;

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

		config = serverConfig();
	});

	beforeEach(async () => {
		mailServiceSendMock.mockClear();
		await cleanupCollections(em);
		config.FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /registrations', () => {
		const setup = async () => {
			const school = schoolEntityFactory.buildWithId();
			const room = roomEntityFactory.buildWithId({ schoolId: school.id });
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });
			const { roomViewerRole, roomOwnerRole } = RoomRolesTestFactory.createRoomRoles();
			const userGroupEntity = groupEntityFactory.buildWithId({
				type: GroupEntityTypes.ROOM,
				users: [
					{ role: roomViewerRole, user: studentUser },
					{ role: roomOwnerRole, user: teacherUser },
				],
				organization: studentUser.school,
				externalSource: undefined,
			});
			const roomMembership = roomMembershipEntityFactory.build({
				userGroupId: userGroupEntity.id,
				roomId: room.id,
				schoolId: school.id,
			});
			await em.persistAndFlush([
				school,
				studentAccount,
				studentUser,
				teacherAccount,
				teacherUser,
				room,
				userGroupEntity,
				roomMembership,
			]);
			em.clear();

			const params: CreateOrUpdateRegistrationBodyParams = {
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
				roomId: room.id,
			};

			return { studentAccount, teacherAccount, params };
		};

		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post();
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has the required permissions', () => {
			const setupForTeacher = async () => {
				const { teacherAccount, params } = await setup();
				const loggedInClient = await testApiClient.login(teacherAccount);

				return { loggedInClient, params };
			};
			describe('when the feature is disabled', () => {
				it('should return a 403 error', async () => {
					config.FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED = false;
					const { loggedInClient, params } = await setupForTeacher();

					const response = await loggedInClient.post(undefined, params);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			it('should create the registration', async () => {
				const { loggedInClient, params } = await setupForTeacher();

				const response = await loggedInClient.post(undefined, params);
				const registrationId = (response.body as { id: string }).id;
				expect(response.status).toBe(HttpStatus.CREATED);
				await expect(em.findOneOrFail(RegistrationEntity, registrationId)).resolves.toMatchObject({
					id: registrationId,
					email: params.email,
					firstName: params.firstName,
					lastName: params.lastName,
				});
			});

			it('should send a mail', async () => {
				const { loggedInClient, params } = await setupForTeacher();

				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.CREATED);

				expect(mailServiceSendMock).toHaveBeenCalledTimes(1);
			});

			describe('when a registration with the given email already exists', () => {
				it('should add the room to the existing registration and return it', async () => {
					const { loggedInClient, params } = await setupForTeacher();
					const existingRegistration = registrationEntityFactory.build({
						email: params.email,
						roomIds: [],
					});

					await em.persist(existingRegistration).flush();
					em.clear();

					const response = await loggedInClient.post(undefined, params);
					expect(response.status).toBe(HttpStatus.CREATED);
					expect(response.body).toMatchObject({
						id: existingRegistration.id,
						email: existingRegistration.email,
					});
				});

				it('should replace the existing first and last name with the new ones', async () => {
					const { loggedInClient, params } = await setupForTeacher();
					const existingRegistration = registrationEntityFactory.build({
						email: params.email,
						firstName: 'OldFirstName',
						lastName: 'OldLastName',
						roomIds: [],
					});

					await em.persist(existingRegistration).flush();
					em.clear();

					const response = await loggedInClient.post(undefined, params);
					expect(response.status).toBe(HttpStatus.CREATED);
					expect(response.body).toMatchObject({
						id: existingRegistration.id,
						email: existingRegistration.email,
						firstName: params.firstName,
						lastName: params.lastName,
					});
				});
			});
		});

		describe('when the user has not required permissions', () => {
			it('should not create the registration', async () => {
				const { studentAccount, params } = await setup();
				const loggedInClient = await testApiClient.login(studentAccount);

				const response = await loggedInClient.post(undefined, params);
				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});
	});
});
