import { EntityManager } from '@mikro-orm/mongodb';
import { serverConfig, ServerConfig, ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { RegistrationEntity } from '../../repo';
import { Permission } from '@shared/domain/interface';
import { CreateRegistrationBodyParams } from '../dto/request/create-registration.body.params';
import { roomEntityFactory } from '@modules/room/testing';
import { registrationEntityFactory } from '@modules/registration/testing';

describe('Registration Controller (API)', () => {
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

	describe('POST /registrations', () => {
		describe('when the user is not authenticated', () => {
			it('should return a 401 error', async () => {
				const response = await testApiClient.post();
				expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when the user has the required permissions', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({}, [Permission.USER_CREATE]);
				const room = roomEntityFactory.buildWithId();
				await em.persistAndFlush([teacherAccount, teacherUser, room]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				const params: CreateRegistrationBodyParams = {
					email: 'test@example.com',
					firstName: 'John',
					lastName: 'Doe',
					roomIds: [room.id],
				};

				return { loggedInClient, room, params };
			};

			describe('when the required parameters are given', () => {
				describe('when the feature is disabled', () => {
					it('should return a 403 error', async () => {
						config.FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED = false;
						const { loggedInClient, params } = await setup();

						const response = await loggedInClient.post(undefined, params);

						expect(response.status).toBe(HttpStatus.FORBIDDEN);
					});
				});

				it('should create the registration', async () => {
					const { loggedInClient, params } = await setup();

					const response = await loggedInClient.post(undefined, params);
					const registrationId = (response.body as { id: string }).id;
					expect(response.status).toBe(HttpStatus.CREATED);
					await expect(em.findOneOrFail(RegistrationEntity, registrationId)).resolves.toMatchObject({
						id: registrationId,
						email: 'test@example.com',
					});
				});

				describe('when a registration with the given email already exists', () => {
					const setupWithExistingRegistration = async () => {
						const { loggedInClient, room, params } = await setup();

						const existingRegistration = registrationEntityFactory.build({
							email: params.email,
							roomIds: [],
						});

						await em.persistAndFlush(existingRegistration);
						em.clear();

						return { loggedInClient, room, params, existingRegistration };
					};
					it('should add the room to the existing registration and return it', async () => {
						const { loggedInClient, existingRegistration, room, params } = await setupWithExistingRegistration();

						const updatedParams = { ...params, roomIds: [room.id] };
						const response = await loggedInClient.post(undefined, updatedParams);
						expect(response.status).toBe(HttpStatus.CREATED);
						expect(response.body).toMatchObject({
							id: existingRegistration.id,
							email: existingRegistration.email,
						});
					});
				});
			});
		});

		describe('when the user has not required permissions', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				const params: CreateRegistrationBodyParams = {
					email: 'test@example.com',
					firstName: 'John',
					lastName: 'Doe',
					roomIds: [],
				};

				return { loggedInClient, studentUser, params };
			};

			describe('when the required parameters are given', () => {
				it('should not create the registration', async () => {
					const { loggedInClient, params } = await setup();

					const response = await loggedInClient.post(undefined, params);
					expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
				});
			});
		});
	});
});
