import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission, School, System } from '@shared/domain';
import { UserLoginMigration } from '@shared/domain/entity/user-login-migration.entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import {
	cleanupCollections,
	schoolFactory,
	systemFactory,
	TestApiClient,
	UserAndAccountTestFactory,
} from '@shared/testing';
import { JwtTestFactory } from '@shared/testing/factory/jwt.test.factory';
import { userLoginMigrationFactory } from '@shared/testing/factory/user-login-migration.factory';
import { OauthTokenResponse } from '@src/modules/oauth/service/dto';
import { SanisResponse, SanisRole } from '@src/modules/provisioning';
import { ServerTestModule } from '@src/modules/server';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { UUID } from 'bson';
import { Response } from 'supertest';
import { Oauth2MigrationParams } from '../dto/oauth2-migration.params';
import { UserLoginMigrationResponse } from '../dto';

jest.mock('jwks-rsa', () => () => {
	return {
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'RS256',
			getPublicKey: jest.fn().mockReturnValue(JwtTestFactory.getPublicKey()),
			rsaPublicKey: JwtTestFactory.getPublicKey(),
		}),
		getSigningKeys: jest.fn(),
	};
});
describe('UserLoginMigrationController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let axiosMock: MockAdapter;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		Configuration.set('PUBLIC_BACKEND_URL', 'http://localhost:3030/api');

		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		axiosMock = new MockAdapter(axios);
		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, '/user-login-migrations');
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('[GET] /user-login-migrations', () => {
		describe('when data is given', () => {
			const setup = async () => {
				const date: Date = new Date(2023, 5, 4);
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
				});
				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: date,
					mandatorySince: date,
					closedAt: undefined,
					finishedAt: undefined,
				});
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, teacherAccount, teacherUser, userLoginMigration]);

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					sourceSystem,
					targetSystem,
					loggedInClient,
					userLoginMigration,
					teacherUser,
				};
			};

			it('should return the users migration', async () => {
				const { sourceSystem, targetSystem, userLoginMigration, teacherUser, loggedInClient } = await setup();

				const response: Response = await loggedInClient.get().query({ userId: teacherUser.id });

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					data: [
						{
							sourceSystemId: sourceSystem.id,
							targetSystemId: targetSystem.id,
							startedAt: userLoginMigration.startedAt.toISOString(),
							closedAt: userLoginMigration.closedAt?.toISOString(),
							finishedAt: userLoginMigration.finishedAt?.toISOString(),
							mandatorySince: userLoginMigration.mandatorySince?.toISOString(),
						},
					],
					total: 1,
				});
			});
		});

		describe('when unauthorized', () => {
			it('should return Unauthorized', async () => {
				const response: Response = await testApiClient.get();

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[POST] /start', () => {
		describe('when current User start the migration successfully', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return the Status CREATED ', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/start`);

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when current User start the migration and is not authorized', () => {
			it('should return Unauthorized', async () => {
				const response: Response = await testApiClient.post(`/start`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when invalid User start the migration', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
				};
			};

			it('should return forbidden', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/start`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when migration already started', () => {
			const setup = async () => {
				const date: Date = new Date(2023, 5, 4);
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: date,
					mandatorySince: date,
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return bad request ', async () => {
				const { loggedInClient, adminUser } = await setup();

				const response: Response = await loggedInClient.post(`/start`).query({ userId: adminUser.id });

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when migration already finished', () => {
			const setup = async () => {
				const date: Date = new Date(2023, 5, 4);
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: date,
					mandatorySince: date,
					finishedAt: date,
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return bad request ', async () => {
				const { loggedInClient, adminUser } = await setup();

				const response: Response = await loggedInClient.post(`/start`).query({ userId: adminUser.id });

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when official school number is not set', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return a bad request ', async () => {
				const { loggedInClient, adminUser } = await setup();

				const response: Response = await loggedInClient.post(`/start`).query({ userId: adminUser.id });

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});
	});

	describe('[GET] /user-login-migrations/migrate-to-oauth2', () => {
		const mockPostOauthTokenEndpoint = (
			idToken: string,
			targetSystem: System,
			targetUserId: string,
			schoolExternalId: string,
			officialSchoolNumber: string
		) => {
			axiosMock
				.onPost(targetSystem.oauthConfig?.tokenEndpoint)
				.replyOnce<OauthTokenResponse>(200, {
					id_token: idToken,
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				})
				.onGet(targetSystem.provisioningUrl)
				.replyOnce<SanisResponse>(200, {
					pid: targetUserId,
					person: {
						name: {
							familienname: 'familienName',
							vorname: 'vorname',
						},
						geschlecht: 'weiblich',
						lokalisierung: 'not necessary',
						vertrauensstufe: 'not necessary',
					},
					personenkontexte: [
						{
							id: new UUID('aef1f4fd-c323-466e-962b-a84354c0e713'),
							rolle: SanisRole.LEHR,
							organisation: {
								id: new UUID('aef1f4fd-c323-466e-962b-a84354c0e713'),
								kennung: officialSchoolNumber,
								name: 'schulName',
								typ: 'not necessary',
							},
							personenstatus: 'not necessary',
							email: 'email',
						},
					],
				});
		};

		describe('when providing a code and being eligible to migrate', () => {
			const setup = async () => {
				const targetSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = 'systemId';
				query.systemId = targetSystem.id;
				query.redirectUri = 'redirectUri';

				const sourceSystem: System = systemFactory.buildWithId();

				const officialSchoolNumber = '12345';
				const externalId = 'aef1f4fd-c323-466e-962b-a84354c0e713';
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber,
					externalId,
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date('2022-12-17T03:24:00'),
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin(
					{ school, externalId: 'externalUserId' },
					[Permission.USER_LOGIN_MIGRATION_ADMIN]
				);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				const idToken: string = JwtTestFactory.createJwt({
					sub: 'testUser',
					iss: targetSystem.oauthConfig?.issuer,
					aud: targetSystem.oauthConfig?.clientId,
				});

				mockPostOauthTokenEndpoint(idToken, targetSystem, adminUser.id, externalId, officialSchoolNumber);

				return {
					query,
					loggedInClient,
					sourceSystem,
					targetSystem,
				};
			};

			it('should migrate the user', async () => {
				const { query, loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/migrate-to-oauth2`).send({
					redirectUri: query.redirectUri,
					code: query.code,
					systemId: query.systemId,
				});

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when migration failed, because of schoolnumbers mismatch', () => {
			const setup = async () => {
				const targetSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = targetSystem.id;
				query.redirectUri = 'redirectUri';

				const sourceSystem: System = systemFactory.buildWithId();

				const officialSchoolNumber = '12345';
				const externalId = 'aef1f4fd-c323-466e-962b-a84354c0e713';
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber,
					externalId,
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date('2022-12-17T03:24:00'),
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({
					school,
					externalId: 'externalUserId',
				});

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				const idToken: string = JwtTestFactory.createJwt({
					sub: 'testUser',
					iss: targetSystem.oauthConfig?.issuer,
					aud: targetSystem.oauthConfig?.clientId,
				});

				mockPostOauthTokenEndpoint(idToken, targetSystem, adminUser.id, externalId, 'kennung');

				return {
					query,
					loggedInClient,
					sourceSystem,
					targetSystem,
				};
			};

			it('should throw Internal Server Error', async () => {
				const { query, loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/migrate-to-oauth2`).send(query);

				expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
			});
		});

		describe('when authentication of user failed', () => {
			const setup = () => {
				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = new ObjectId().toHexString();
				query.redirectUri = 'redirectUri';

				return {
					query,
				};
			};

			it('should throw an UnauthorizedException', async () => {
				const { query } = setup();

				const response: Response = await testApiClient.post(`migrate-to-oauth2`).send(query);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[POST] /restart', () => {
		describe('when current User restart the migration successfully', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 5, 4),
					closedAt: new Date(2023, 5, 20),
					finishedAt: new Date(2055, 5, 4),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return the Status OK ', async () => {
				const { loggedInClient, adminUser } = await setup();

				const response: Response = await loggedInClient.put(`/restart`).query({ userId: adminUser.id });

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should return the response ', async () => {
				const { loggedInClient, adminUser } = await setup();

				const response: Response = await loggedInClient.put(`/restart`).query({ userId: adminUser.id });

				expect(response.body).toHaveProperty('startedAt');
				expect(response.body).not.toHaveProperty('closedAt');
				expect(response.body).not.toHaveProperty('finishedAt');
			});
		});

		describe('when invalid User restart the migration', () => {
			const setup = async () => {
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();

				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return forbidden', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/restart`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when current User restart the migration and is not authorized', () => {
			it('should return Unauthorized', async () => {
				const response: Response = await testApiClient.put(`/restart`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when migration is already started', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 5, 4),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return bad request ', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/restart`);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when migration is finally finished', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
					finishedAt: new Date(2023, 1, 20),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return bad request ', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/restart`);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when official school number is not set', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return a bad request ', async () => {
				const { loggedInClient, adminUser } = await setup();

				const response: Response = await loggedInClient.put(`/restart`).query({ userId: adminUser.id });

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});
	});

	describe('[PUT] /toggle', () => {
		describe('when migration is optional', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
					mandatorySince: undefined,
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('it should set migration to mandatory', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/toggle`);

				const responseBody = response.body as UserLoginMigrationResponse;
				expect(responseBody.mandatorySince).toBeDefined();
			});
		});

		describe('when migration is mandatory', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					mandatorySince: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('it should set migration to optional', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/toggle`);

				const responseBody = response.body as UserLoginMigrationResponse;
				expect(responseBody.mandatorySince).toBeUndefined();
			});
		});

		describe('when migration is not started', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return a bad request', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/toggle`);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});

		describe('when user is not authorized', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, [
					Permission.USER_LOGIN_MIGRATION_ADMIN,
				]);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('should return unauthorized', async () => {
				await setup();

				const response: Response = await testApiClient.put(`/toggle`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has not the required permission', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: System = systemFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigration = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school }, []);

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};
			it('should return forbidden', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/toggle`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});
	});
});
