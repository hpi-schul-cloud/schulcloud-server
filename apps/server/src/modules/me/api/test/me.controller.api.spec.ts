import { AUDIT_LOGGER_PROVIDER } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { EntityManager } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { systemEntityFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { MeResponse } from '../dto';

const mapToMeResponseObject = (user: User, account: AccountEntity, permissions: Permission[]): MeResponse => {
	const roles = user.getRoles();
	const role = roles[0];
	const { school } = user;

	const meResponseObject: MeResponse = {
		school: {
			id: school.id,
			name: school.name,
			logo: {},
		},
		user: {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
		},
		roles: [
			{
				id: role.id,
				name: role.name,
			},
		],
		preferences: user.getPreferences(),
		permissions,
		account: {
			id: account.id,
		},
	};

	return meResponseObject;
};

describe('Me Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let userService: UserService;
	let jwtConfig: TestJwtModuleConfig;
	let moduleFixture: TestingModule;

	describe('me', () => {
		describe('when user is logged in with SVS', () => {
			beforeAll(async () => {
				moduleFixture = await Test.createTestingModule({
					imports: [ServerTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
				}).compile();

				app = moduleFixture.createNestApplication();
				await app.init();
				em = app.get(EntityManager);
				testApiClient = new TestApiClient(app, 'me');
				userService = app.get(UserService);
				jwtConfig = moduleFixture.get(TEST_JWT_CONFIG_TOKEN);
			});

			beforeEach(async () => {
				await cleanupCollections(em);
			});

			afterAll(async () => {
				await app.close();
			});

			describe('when no jwt is passed', () => {
				it('should respond with unauthorized exception', async () => {
					const response = await testApiClient.get();

					expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
					expect(response.body).toEqual({
						type: 'UNAUTHORIZED',
						title: 'Unauthorized',
						message: 'Unauthorized',
						code: 401,
					});
				});
			});

			describe('when valid jwt is passed', () => {
				describe('when user is a student', () => {
					const setup = async () => {
						const school = schoolEntityFactory.build();
						const { studentAccount: account, studentUser: user } = UserAndAccountTestFactory.buildStudent({ school });
						await em.persist([account, user]).flush();
						em.clear();

						const loggedInClient = await testApiClient.login(account);
						const expectedPermissions = userService.resolvePermissions(user);
						const expectedResponse = mapToMeResponseObject(user, account, expectedPermissions);

						return { loggedInClient, expectedResponse };
					};

					it('should respond with "me" information and status code 200', async () => {
						const { loggedInClient, expectedResponse } = await setup();

						const response = await loggedInClient.get();

						expect(response.statusCode).toEqual(HttpStatus.OK);
						expect(response.body).toEqual(expectedResponse);
					});
				});

				describe('when user is a teacher', () => {
					const setup = async () => {
						const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();

						await em.persist([account, user]).flush();
						em.clear();

						const loggedInClient = await testApiClient.login(account);
						const expectedPermissions = userService.resolvePermissions(user);
						const expectedResponse = mapToMeResponseObject(user, account, expectedPermissions);

						return { loggedInClient, expectedResponse };
					};

					it('should respond with "me" information and status code 200', async () => {
						const { loggedInClient, expectedResponse } = await setup();

						const response = await loggedInClient.get();

						expect(response.statusCode).toEqual(HttpStatus.OK);
						expect(response.body).toEqual(expectedResponse);
					});
				});

				describe('when user is an admin', () => {
					const setup = async () => {
						const { adminAccount: account, adminUser: user } = UserAndAccountTestFactory.buildAdmin();

						await em.persist([account, user]).flush();
						em.clear();

						const loggedInClient = await testApiClient.login(account);
						const expectedPermissions = userService.resolvePermissions(user);
						const expectedResponse = mapToMeResponseObject(user, account, expectedPermissions);

						return { loggedInClient, expectedResponse };
					};

					it('should respond with "me" information and status code 200', async () => {
						const { loggedInClient, expectedResponse } = await setup();

						const response = await loggedInClient.get();

						expect(response.statusCode).toEqual(HttpStatus.OK);
						expect(response.body).toEqual(expectedResponse);
					});
				});

				describe('when user is logged in with external system', () => {
					const setup = async () => {
						const system = systemEntityFactory.build();
						const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({
							systemId: system.id,
						});

						await em.persist([studentAccount, studentUser, system]).flush();
						em.clear();

						const loggedInClient = testApiClient.loginByUser(studentAccount, studentUser, jwtConfig, {
							isExternalUser: true,
							systemId: system.id,
						});
						const expectedPermissions = userService.resolvePermissions(studentUser);

						const expectedResponse = mapToMeResponseObject(studentUser, studentAccount, expectedPermissions);
						expectedResponse.systemId = system.id;

						return { loggedInClient, expectedResponse, currentUserId: studentUser.id };
					};

					it('should return a "me" response with the corresponding system info with status 200', async () => {
						const { loggedInClient, expectedResponse } = await setup();

						const response = await loggedInClient.get();

						expect(response.statusCode).toEqual(HttpStatus.OK);
						expect(response.body).toEqual(expectedResponse);
					});

					describe('updateMePreferences', () => {
						it('should update the releaseDate preference and return status code 204', async () => {
							const { loggedInClient, currentUserId } = await setup();

							const newReleaseDate = new Date('2024-12-31T00:00:00Z').toISOString();

							const response = await loggedInClient.patch('preferences', { releaseDate: newReleaseDate });

							expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);

							const updatedUser = await em.findOneOrFail(User, { id: currentUserId });
							expect(updatedUser.getPreferences().releaseDate as string).toEqual(newReleaseDate);
						});

						it('should respond with validation error if an invalid releaseDate is passed', async () => {
							const { loggedInClient } = await setup();

							const response = await loggedInClient.patch('preferences').send({ releaseDate: 'invalid-date' });

							expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
						});
					});
				});
			});
		});
		describe('when user is a service account', () => {
			let serviceAccountApp: INestApplication;
			let serviceAccountEm: EntityManager;
			let serviceAccountTestApiClient: TestApiClient;
			let serviceAccountJwtConfig: TestJwtModuleConfig;
			let mockWinstonLogger: { info: jest.Mock };

			beforeAll(async () => {
				mockWinstonLogger = { info: jest.fn() };

				const serviceAccountModuleFixture = await Test.createTestingModule({
					imports: [ServerTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
				})
					.overrideProvider(AUDIT_LOGGER_PROVIDER)
					.useValue(mockWinstonLogger)
					.compile();

				serviceAccountApp = serviceAccountModuleFixture.createNestApplication();
				await serviceAccountApp.init();
				serviceAccountEm = serviceAccountApp.get(EntityManager);
				serviceAccountTestApiClient = new TestApiClient(serviceAccountApp, 'me');
				serviceAccountJwtConfig = serviceAccountModuleFixture.get(TEST_JWT_CONFIG_TOKEN);
			});

			beforeEach(async () => {
				await cleanupCollections(serviceAccountEm);
				mockWinstonLogger.info.mockClear();
			});

			afterAll(async () => {
				await serviceAccountApp.close();
			});

			const setup = async () => {
				const { serviceAccount, serviceAccountUser } = UserAndAccountTestFactory.buildServiceAccount();

				await serviceAccountEm.persist([serviceAccount, serviceAccountUser]).flush();
				serviceAccountEm.clear();

				const loggedInClient = serviceAccountTestApiClient.loginByUser(
					serviceAccount,
					serviceAccountUser,
					serviceAccountJwtConfig,
					{ isServiceAccount: true }
				);

				return { loggedInClient, userId: serviceAccountUser.id };
			};

			it('should respond with "me" information and status code 200', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toBeDefined();
			});

			it('should call the audit interceptor for service account requests', async () => {
				const { loggedInClient, userId } = await setup();

				await loggedInClient.get();

				expect(mockWinstonLogger.info).toHaveBeenCalledTimes(1);
				expect(mockWinstonLogger.info).toHaveBeenCalledWith({
					message: `[AUDIT] Actor: ServiceAccount: ${userId} | Action: API GET /me/ -> 200`,
				});
			});
		});
	});
});
