import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { SchulconnexResponse, SchulconnexRole } from '@infra/schulconnex-client';
import { SchulconnexPoliciesInfoResponse } from '@infra/schulconnex-client/response';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { OauthTokenResponse } from '@modules/oauth/service/dto';
import { ServerTestModule } from '@modules/server';
import { type SystemEntity } from '@modules/system/entity';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportUser, SchoolEntity, User } from '@shared/domain/entity';
import { UserLoginMigrationEntity } from '@shared/domain/entity/user-login-migration.entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import {
	cleanupCollections,
	importUserFactory,
	JwtTestFactory,
	schoolEntityFactory,
	systemEntityFactory,
	TestApiClient,
	UserAndAccountTestFactory,
	userFactory,
	userLoginMigrationFactory,
} from '@shared/testing';
import { ErrorResponse } from '@src/core/error/dto';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { UUID } from 'bson';
import { Response } from 'supertest';
import { DeepPartial } from 'fishery';
import { ForceMigrationParams, Oauth2MigrationParams, UserLoginMigrationResponse } from '../dto';

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
	let configService: ConfigService;

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
		configService = app.get(ConfigService);
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
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
				});
				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: date,
					mandatorySince: date,
					closedAt: date,
					finishedAt: date,
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
							id: userLoginMigration.id,
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

	describe('[GET] /user-login-migrations/schools/:schoolId', () => {
		describe('when a user login migration exists', () => {
			const setup = async () => {
				const date: Date = new Date(2023, 5, 4);
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
				});
				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: date,
					mandatorySince: date,
					closedAt: undefined,
					finishedAt: undefined,
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					sourceSystem,
					targetSystem,
					loggedInClient,
					userLoginMigration,
					school,
				};
			};

			it('should return the users migration', async () => {
				const { sourceSystem, targetSystem, userLoginMigration, loggedInClient, school } = await setup();

				const response: Response = await loggedInClient.get(`schools/${school.id}`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					id: userLoginMigration.id,
					sourceSystemId: sourceSystem.id,
					targetSystemId: targetSystem.id,
					startedAt: userLoginMigration.startedAt.toISOString(),
					closedAt: userLoginMigration.closedAt?.toISOString(),
					finishedAt: userLoginMigration.finishedAt?.toISOString(),
					mandatorySince: userLoginMigration.mandatorySince?.toISOString(),
				});
			});
		});

		describe('when no user login migration exists', () => {
			const setup = async () => {
				const school: SchoolEntity = schoolEntityFactory.buildWithId();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([school, adminAccount, adminUser]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					school,
				};
			};

			it('should have the status "not found"', async () => {
				const { loggedInClient, school } = await setup();

				const response: Response = await loggedInClient.get(`schools/${school.id}`);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});

			it('should return an error response', async () => {
				const { loggedInClient, school } = await setup();

				const response: Response = await loggedInClient.get(`schools/${school.id}`);

				expect(response.body).toEqual<ErrorResponse>({
					message: 'Not Found',
					type: 'NOT_FOUND',
					code: 404,
					title: 'Not Found',
				});
			});
		});

		describe('when unauthorized', () => {
			it('should return Unauthorized', async () => {
				const response: Response = await testApiClient.get(`schools/${new ObjectId().toHexString()}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('[POST] /start', () => {
		describe('when current user start the migration successfully', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					sourceSystem,
					targetSystem,
				};
			};

			it('should return the Status CREATED', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/start`);

				expect(response.status).toEqual(HttpStatus.CREATED);
			});

			it('should return the user login migration', async () => {
				const { loggedInClient, sourceSystem, targetSystem } = await setup();

				const response: Response = await loggedInClient.post(`/start`);

				expect(response.body).toEqual({
					id: expect.any(String),
					sourceSystemId: sourceSystem.id,
					startedAt: expect.any(String),
					targetSystemId: targetSystem.id,
				});
			});

			it('should should change the database correctly', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/start`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
				await em.findOneOrFail(UserLoginMigrationEntity, { id: response.body.id });
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
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: date,
					mandatorySince: date,
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return the Status CREATED', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/start`);

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when migration already closed', () => {
			const setup = async () => {
				const date: Date = new Date(2023, 5, 4);
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: date,
					mandatorySince: date,
					closedAt: date,
					finishedAt: date,
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return unprocessable entity', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/start`);

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});

		describe('when official school number is not set', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser]);

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return a unprocessable entity', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/start`);

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});
	});

	describe('[GET] /user-login-migrations/migrate-to-oauth2', () => {
		const mockAxiosRequests = (
			idToken: string,
			targetSystem: SystemEntity,
			targetUserId: string,
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
				.replyOnce<SchulconnexResponse>(200, {
					pid: targetUserId,
					person: {
						name: {
							familienname: 'familienName',
							vorname: 'vorname',
						},
					},
					personenkontexte: [
						{
							id: new UUID('aef1f4fd-c323-466e-962b-a84354c0e713').toString(),
							rolle: SchulconnexRole.LEHR,
							organisation: {
								id: new UUID('aef1f4fd-c323-466e-962b-a84354c0e713').toString(),
								kennung: officialSchoolNumber,
								name: 'schulName',
							},
						},
					],
				})
				.onGet(configService.get('PROVISIONING_SCHULCONNEX_POLICIES_INFO_URL'))
				.replyOnce<SchulconnexPoliciesInfoResponse[]>(200, []);
		};

		describe('when providing a code and being eligible to migrate', () => {
			const setup = async () => {
				const targetSystem: SystemEntity = systemEntityFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = 'systemId';
				query.systemId = targetSystem.id;
				query.redirectUri = 'redirectUri';

				const sourceSystem: SystemEntity = systemEntityFactory.buildWithId();

				const officialSchoolNumber = '12345';
				const externalId = 'aef1f4fd-c323-466e-962b-a84354c0e713';
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber,
					externalId,
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
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

				mockAxiosRequests(idToken, targetSystem, adminUser.id, officialSchoolNumber);

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
				const targetSystem: SystemEntity = systemEntityFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = targetSystem.id;
				query.redirectUri = 'redirectUri';

				const sourceSystem: SystemEntity = systemEntityFactory.buildWithId();

				const officialSchoolNumber = '12345';
				const externalId = 'aef1f4fd-c323-466e-962b-a84354c0e713';
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber,
					externalId,
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
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

				mockAxiosRequests(idToken, targetSystem, adminUser.id, 'kennung');

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
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 5, 4),
					closedAt: new Date(2023, 5, 20),
					finishedAt: new Date(2055, 5, 4),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return the Status OK ', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/restart`);

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should return the response ', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/restart`);

				expect(response.body).toHaveProperty('startedAt');
				expect(response.body).not.toHaveProperty('closedAt');
				expect(response.body).not.toHaveProperty('finishedAt');
			});

			it('should should change the database correctly', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/restart`);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
				const entity = await em.findOneOrFail(UserLoginMigrationEntity, { id: response.body.id });

				expect(entity.startedAt).toBeDefined();
				expect(entity.closedAt).toBeUndefined();
				expect(entity.finishedAt).toBeUndefined();
			});
		});

		describe('when invalid User restart the migration', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school: teacherUser.school,
				});

				await em.persistAndFlush([teacherAccount, teacherUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

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
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 5, 4),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return OK', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/restart`);

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});

		describe('when migration is finally finished', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
					finishedAt: new Date(2023, 1, 20),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					adminUser,
				};
			};

			it('should return unprocessable entity', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put(`/restart`);

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});
	});

	describe('[PUT] /mandatory', () => {
		describe('when migration is set from optional to mandatory', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					mandatorySince: undefined,
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

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

				const response: Response = await loggedInClient.put('/mandatory', { mandatory: true });

				const responseBody = response.body as UserLoginMigrationResponse;
				expect(responseBody.mandatorySince).toBeDefined();
			});

			it('should should change the database correctly', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put('/mandatory', { mandatory: true });

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
				const entity = await em.findOneOrFail(UserLoginMigrationEntity, { id: response.body.id });

				expect(entity.mandatorySince).toBeDefined();
			});
		});

		describe('when migration is set from mandatory to optional', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					mandatorySince: new Date(2023, 1, 4),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

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

				const response: Response = await loggedInClient.put('/mandatory', { mandatory: false });

				const responseBody = response.body as UserLoginMigrationResponse;
				expect(responseBody.mandatorySince).toBeUndefined();
			});

			it('should should change the database correctly', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put('/mandatory', { mandatory: false });

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
				const entity = await em.findOneOrFail(UserLoginMigrationEntity, { id: response.body.id });

				expect(entity.mandatorySince).toBeUndefined();
			});
		});

		describe('when migration is not started', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return a not found', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put('/mandatory', { mandatory: true });

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when the migration is closed', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
				});
				school.userLoginMigration = userLoginMigration;

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('should return unprocessable entity', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put('/mandatory', { mandatory: true });

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});

		describe('when user is not authorized', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.put('/mandatory', { mandatory: true });

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has not the required permission', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
				});
				school.userLoginMigration = userLoginMigration;

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, teacherAccount, teacherUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('should return forbidden', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.put('/mandatory', { mandatory: true });

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});
	});

	describe('[POST] /close', () => {
		describe('when the user login migration is running', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});
				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
				});

				const migratedUser: User = userFactory.buildWithId({
					lastLoginSystemChange: new Date(2023, 1, 5),
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([
					sourceSystem,
					targetSystem,
					school,
					adminAccount,
					adminUser,
					userLoginMigration,
					migratedUser,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('should return ok', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/close');

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should return the closed user login migration', async () => {
				const { loggedInClient, userLoginMigration } = await setup();

				const response: Response = await loggedInClient.post('/close');

				expect(response.body).toEqual({
					id: expect.any(String),
					targetSystemId: userLoginMigration.targetSystem.id,
					sourceSystemId: userLoginMigration.sourceSystem?.id,
					startedAt: userLoginMigration.startedAt.toISOString(),
					closedAt: expect.any(String),
					finishedAt: expect.any(String),
				});
			});

			it('should should change the database correctly', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/close');

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
				const entity = await em.findOneOrFail(UserLoginMigrationEntity, { id: response.body.id });

				expect(entity.closedAt).toBeDefined();
				expect(entity.finishedAt).toBeDefined();
			});
		});

		describe('when migration is not started', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return a not found', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/close');

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});

			it('should return an error response', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/close');

				expect(response.body).toEqual<ErrorResponse>({
					message: 'Not Found',
					type: 'USER_LOGIN_MIGRATION_NOT_FOUND',
					code: 404,
					title: 'User Login Migration Not Found',
				});
			});
		});

		describe('when the migration is already closed', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
				});

				const migratedUser = userFactory.buildWithId({
					school,
					lastLoginSystemChange: new Date(2023, 1, 4),
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([
					sourceSystem,
					targetSystem,
					school,
					adminAccount,
					adminUser,
					userLoginMigration,
					migratedUser,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('should return status ok', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/close');

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should return the same user login migration', async () => {
				const { loggedInClient, userLoginMigration } = await setup();

				const response: Response = await loggedInClient.post('/close');

				expect(response.body).toEqual({
					id: userLoginMigration.id,
					targetSystemId: userLoginMigration.targetSystem.id,
					sourceSystemId: userLoginMigration.sourceSystem?.id,
					startedAt: userLoginMigration.startedAt.toISOString(),
					closedAt: userLoginMigration.closedAt?.toISOString(),
				});
			});
		});

		describe('when the migration is finished', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
					finishedAt: new Date(2023, 1, 6),
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, adminAccount, adminUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('should return unprocessable entity', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/close');

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});

		describe('when user is not authorized', () => {
			it('should return unauthorized', async () => {
				const response: Response = await testApiClient.post('/close');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user has not the required permission', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
					closedAt: new Date(2023, 1, 5),
				});

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, teacherAccount, teacherUser, userLoginMigration]);
				em.clear();

				const loggedInClient = await testApiClient.login(teacherAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('should return forbidden', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/close');

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when no user has migrate', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
				});
				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
				});

				const user: User = userFactory.buildWithId();

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([
					sourceSystem,
					targetSystem,
					school,
					adminAccount,
					adminUser,
					userLoginMigration,
					user,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
				};
			};

			it('should return nothing', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/close');

				expect(response.body).toEqual({});
			});
		});

		describe('when the migration wizard is also running', () => {
			const setup = async () => {
				const sourceSystem: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'SourceSystem' });
				const targetSystem: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'SANIS' });
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '12345',
					inUserMigration: true,
					inMaintenanceSince: new Date(2024, 1, 4),
				});
				const importUser = importUserFactory.build({ school });
				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					startedAt: new Date(2023, 1, 4),
				});

				const migratedUser: User = userFactory.buildWithId({
					lastLoginSystemChange: new Date(2023, 1, 5),
				});

				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([
					sourceSystem,
					targetSystem,
					school,
					adminAccount,
					adminUser,
					userLoginMigration,
					migratedUser,
					importUser,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
					userLoginMigration,
					adminUser,
				};
			};

			it('should close migration wizard', async () => {
				const { loggedInClient, adminUser } = await setup();

				await loggedInClient.post('/close');

				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const [entities, count] = await em.findAndCount(ImportUser, {});
				expect(count).toEqual(0);

				const school = await em.findOneOrFail(SchoolEntity, { id: adminUser.school.id });
				expect(school.inUserMigration).toBe(undefined);
				expect(school.inMaintenanceSince).toBe(undefined);
			});
		});
	});

	describe('[POST] /user-login-migrations/force-migration', () => {
		const expectSchoolMigrationUnchanged = (
			school: SchoolEntity,
			externalId: string,
			sourceSystem: SystemEntity,
			targetSystem: SystemEntity
		) => {
			const expectedSchoolPartial: DeepPartial<SchoolEntity> = {
				externalId,
			};
			expect(school).toEqual(expect.objectContaining(expectedSchoolPartial));

			const systems: SystemEntity[] = school?.systems.getItems();
			systems?.forEach((system) => {
				expect([sourceSystem.id, targetSystem.id]).toContainEqual(system.id);
			});
		};

		const expectUserMigrated = (migratedUser: User, preMigratedUser: User, externalId: string) => {
			const expectedUserPartial: DeepPartial<User> = {
				externalId,
			};
			expect(migratedUser).toEqual(expect.objectContaining(expectedUserPartial));
			expect(migratedUser.lastLoginSystemChange).not.toEqual(preMigratedUser.lastLoginSystemChange);
			expect(migratedUser.previousExternalId).toEqual(preMigratedUser.externalId);
		};

		describe('when forcing a school to migrate', () => {
			const setup = async () => {
				const targetSystem: SystemEntity = systemEntityFactory
					.withOauthConfig()
					.buildWithId({ alias: 'SANIS', provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const sourceSystem: SystemEntity = systemEntityFactory.buildWithId();

				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem],
				});

				const email = 'admin@test.com';
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({
					email,
					school,
				});
				const { superheroAccount, superheroUser } = UserAndAccountTestFactory.buildSuperhero();

				await em.persistAndFlush([
					sourceSystem,
					targetSystem,
					school,
					superheroAccount,
					superheroUser,
					adminAccount,
					adminUser,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(superheroAccount);

				const requestBody: ForceMigrationParams = new ForceMigrationParams();
				requestBody.email = email;
				requestBody.externalUserId = 'externalUserId';
				requestBody.externalSchoolId = 'externalSchoolId';

				return {
					requestBody,
					loggedInClient,
					sourceSystem,
					targetSystem,
					school,
					adminUser,
				};
			};

			it('should start the migration for the school and migrate the user and school', async () => {
				const { requestBody, loggedInClient, school, sourceSystem, targetSystem, adminUser } = await setup();

				const response: Response = await loggedInClient.post(`/force-migration`, requestBody);

				expect(response.status).toEqual(HttpStatus.CREATED);

				const userLoginMigration = await em.findOneOrFail(UserLoginMigrationEntity, { school: school.id });
				expect(userLoginMigration.sourceSystem?.id).toEqual(sourceSystem.id);
				expect(userLoginMigration.targetSystem.id).toEqual(targetSystem.id);

				const schoolEntity = await em.findOneOrFail(SchoolEntity, school.id);
				expect(schoolEntity).toEqual(
					expect.objectContaining({
						externalId: requestBody.externalSchoolId,
					})
				);

				const migratedUser = await em.findOneOrFail(User, adminUser.id);
				expectUserMigrated(migratedUser, adminUser, requestBody.externalUserId);
			});
		});

		describe('when forcing a user in a migrated school to migrate', () => {
			const setup = async () => {
				const targetSystem: SystemEntity = systemEntityFactory
					.withOauthConfig()
					.buildWithId({ alias: 'SANIS', provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const sourceSystem: SystemEntity = systemEntityFactory.buildWithId();

				const externalSchoolId = 'externalSchoolId';
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem, targetSystem],
					externalId: externalSchoolId,
				});

				const email = 'student@test.com';
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({
					email,
					school,
				});
				const { superheroAccount, superheroUser } = UserAndAccountTestFactory.buildSuperhero();

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
				});

				await em.persistAndFlush([
					sourceSystem,
					targetSystem,
					school,
					superheroAccount,
					superheroUser,
					studentAccount,
					studentUser,
					userLoginMigration,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(superheroAccount);

				const requestBody: ForceMigrationParams = new ForceMigrationParams();
				requestBody.email = email;
				requestBody.externalUserId = 'externalUserId';
				requestBody.externalSchoolId = externalSchoolId;

				return {
					requestBody,
					loggedInClient,
					sourceSystem,
					targetSystem,
					school,
					studentUser,
				};
			};

			it('should migrate the user without changing the school migration', async () => {
				const { requestBody, loggedInClient, school, sourceSystem, targetSystem, studentUser } = await setup();

				const response: Response = await loggedInClient.post(`/force-migration`, requestBody);

				expect(response.status).toEqual(HttpStatus.CREATED);

				const userLoginMigration = await em.findOneOrFail(UserLoginMigrationEntity, {
					school: school.id,
				});
				expect(userLoginMigration.targetSystem.id).toEqual(targetSystem.id);

				const migratedSchool = await em.findOneOrFail(SchoolEntity, school.id);
				expectSchoolMigrationUnchanged(migratedSchool, requestBody.externalSchoolId, sourceSystem, targetSystem);

				const migratedUser = await em.findOneOrFail(User, studentUser.id);
				expectUserMigrated(migratedUser, studentUser, requestBody.externalUserId);
			});
		});

		describe('when forcing a correction on a migrated user', () => {
			const setup = async () => {
				const targetSystem: SystemEntity = systemEntityFactory
					.withOauthConfig()
					.buildWithId({ alias: 'SANIS', provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const sourceSystem: SystemEntity = systemEntityFactory.buildWithId();

				const externalSchoolId = 'externalSchoolId';
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem, targetSystem],
					externalId: externalSchoolId,
				});

				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
				});

				const email = 'student@test.com';
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({
					email,
					school,
				});
				teacherUser.externalId = 'badExternalUserId';
				const loginChange = new Date(userLoginMigration.startedAt);
				loginChange.setDate(loginChange.getDate() + 1);
				teacherUser.lastLoginSystemChange = loginChange;

				const { superheroAccount, superheroUser } = UserAndAccountTestFactory.buildSuperhero();

				await em.persistAndFlush([
					sourceSystem,
					targetSystem,
					school,
					superheroAccount,
					superheroUser,
					teacherAccount,
					teacherUser,
					userLoginMigration,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(superheroAccount);

				const requestBody: ForceMigrationParams = new ForceMigrationParams();
				requestBody.email = email;
				requestBody.externalUserId = 'correctExternalUserId';
				requestBody.externalSchoolId = externalSchoolId;

				return {
					requestBody,
					loggedInClient,
					sourceSystem,
					targetSystem,
					school,
					teacherUser,
				};
			};

			it('should correct the user without changing the migration', async () => {
				const { requestBody, loggedInClient, school, sourceSystem, targetSystem, teacherUser } = await setup();

				const response: Response = await loggedInClient.post(`/force-migration`, requestBody);

				expect(response.status).toEqual(HttpStatus.CREATED);

				const userLoginMigration = await em.findOneOrFail(UserLoginMigrationEntity, { school: school.id });
				expect(userLoginMigration.targetSystem.id).toEqual(targetSystem.id);

				const migratedSchool = await em.findOneOrFail(SchoolEntity, school.id);
				expectSchoolMigrationUnchanged(migratedSchool, requestBody.externalSchoolId, sourceSystem, targetSystem);

				const expectedUserPartial: DeepPartial<User> = {
					externalId: requestBody.externalUserId,
					lastLoginSystemChange: teacherUser.lastLoginSystemChange,
					previousExternalId: teacherUser.previousExternalId,
				};
				const correctedUser = await em.findOneOrFail(User, teacherUser.id);
				expect(correctedUser).toEqual(expect.objectContaining(expectedUserPartial));
			});
		});

		describe('when forcing a user migration after the migration is closed or finished', () => {
			const setup = async () => {
				const targetSystem: SystemEntity = systemEntityFactory
					.withOauthConfig()
					.buildWithId({ alias: 'SANIS', provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const sourceSystem: SystemEntity = systemEntityFactory.buildWithId();

				const externalSchoolId = 'externalSchoolId';
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [sourceSystem, targetSystem],
					externalId: externalSchoolId,
				});

				const now = new Date();
				const closedAt = new Date(now);
				closedAt.setMonth(now.getMonth() - 1);
				const finishedAt = new Date(closedAt);
				finishedAt.setDate(finishedAt.getDate() + 7);
				const userLoginMigration: UserLoginMigrationEntity = userLoginMigrationFactory.buildWithId({
					school,
					targetSystem,
					sourceSystem,
					closedAt,
					finishedAt,
				});

				const email = 'student@test.com';
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher({
					email,
					school,
				});

				const { superheroAccount, superheroUser } = UserAndAccountTestFactory.buildSuperhero();

				await em.persistAndFlush([
					sourceSystem,
					targetSystem,
					school,
					superheroAccount,
					superheroUser,
					teacherAccount,
					teacherUser,
					userLoginMigration,
				]);
				em.clear();

				const loggedInClient = await testApiClient.login(superheroAccount);

				const requestBody: ForceMigrationParams = new ForceMigrationParams();
				requestBody.email = email;
				requestBody.externalUserId = 'externalUserId';
				requestBody.externalSchoolId = externalSchoolId;

				return {
					requestBody,
					loggedInClient,
				};
			};

			it('should throw an UnprocessableEntityException', async () => {
				const { requestBody, loggedInClient } = await setup();

				const response: Response = await loggedInClient.post(`/force-migration`, requestBody);

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});

		describe('when authentication of user failed', () => {
			const setup = () => {
				const requestBody: ForceMigrationParams = new ForceMigrationParams();
				requestBody.email = 'fail@test.com';
				requestBody.externalUserId = 'externalUserId';
				requestBody.externalSchoolId = 'externalSchoolId';

				return {
					requestBody,
				};
			};

			it('should throw an UnauthorizedException', async () => {
				const { requestBody } = setup();

				const response: Response = await testApiClient.post(`/force-migration`, requestBody);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
