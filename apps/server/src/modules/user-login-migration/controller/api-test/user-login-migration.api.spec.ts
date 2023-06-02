import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, Permission, RoleName, School, System, User } from '@shared/domain';
import { UserLoginMigration } from '@shared/domain/entity/user-login-migration.entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import {
	accountFactory,
	cleanupCollections,
	mapUserToCurrentUser,
	roleFactory,
	schoolFactory,
	systemFactory,
	userFactory,
} from '@shared/testing';
import { JwtTestFactory } from '@shared/testing/factory/jwt.test.factory';
import { userLoginMigrationFactory } from '@shared/testing/factory/user-login-migration.factory';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { OauthTokenResponse } from '@src/modules/oauth/service/dto';
import { SanisResponse, SanisRole } from '@src/modules/provisioning';
import { ServerTestModule } from '@src/modules/server';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { UUID } from 'bson';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { Oauth2MigrationParams } from '../dto/oauth2-migration.params';

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
	let userJwt: string;
	let currentUser: ICurrentUser | undefined;
	let axiosMock: MockAdapter;

	beforeAll(async () => {
		Configuration.set('PUBLIC_BACKEND_URL', 'http://localhost:3030/api');
		userJwt = JwtTestFactory.createJwt();

		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					req.headers.authorization = userJwt;
					return true;
				},
			})
			.compile();
		axiosMock = new MockAdapter(axios);
		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
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
					closedAt: date,
					finishedAt: date,
				});
				const user: User = userFactory.buildWithId({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user, userLoginMigration]);

				currentUser = mapUserToCurrentUser(user);

				return {
					sourceSystem,
					targetSystem,
					user,
					userLoginMigration,
				};
			};

			it('should return the users migration', async () => {
				const { sourceSystem, targetSystem, user, userLoginMigration } = await setup();

				const response: Response = await request(app.getHttpServer())
					.get(`/user-login-migrations`)
					.query({ userId: user.id });

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
			const setup = () => {
				currentUser = undefined;
			};

			it('should return Unauthorized', async () => {
				setup();

				const response: Response = await request(app.getHttpServer())
					.get(`/user-login-migrations`)
					.query({ userId: new ObjectId().toHexString() });

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

				const adminRole = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				});

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user]);

				currentUser = mapUserToCurrentUser(user);

				return {
					user,
				};
			};

			it('should return the Status CREATED ', async () => {
				const { user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/start`)
					.query({ userId: user.id });

				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when current User start the migration and is not authorized', () => {
			const setup = () => {
				currentUser = undefined;
			};

			it('should return Unauthorized', async () => {
				setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/start`)
					.query({ userId: new ObjectId().toHexString() });

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
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

				const adminRole = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				});

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user, userLoginMigration]);

				currentUser = mapUserToCurrentUser(user);

				return {
					user,
				};
			};

			it('should return bad request ', async () => {
				const { user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/start`)
					.query({ userId: user.id });

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

				const adminRole = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				});

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user, userLoginMigration]);

				currentUser = mapUserToCurrentUser(user);

				return {
					user,
				};
			};

			it('should return bad request ', async () => {
				const { user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/start`)
					.query({ userId: user.id });

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

				const adminRole = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				});

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user]);

				currentUser = mapUserToCurrentUser(user);

				return {
					user,
				};
			};

			it('should return a bad request ', async () => {
				const { user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/start`)
					.query({ userId: user.id });

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

				const user: User = userFactory.buildWithId({ externalId: 'externalUserId', school });

				const account: Account = accountFactory.buildWithId({
					userId: user.id,
					systemId: sourceSystem.id,
					username: user.email,
				});

				await em.persistAndFlush([sourceSystem, targetSystem, school, user, account, userLoginMigration]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);

				const idToken: string = JwtTestFactory.createJwt({
					sub: 'testUser',
					iss: targetSystem.oauthConfig?.issuer,
					aud: targetSystem.oauthConfig?.clientId,
				});

				mockPostOauthTokenEndpoint(idToken, targetSystem, currentUser.userId, externalId, officialSchoolNumber);

				return {
					query,
					user,
					sourceSystem,
					targetSystem,
				};
			};

			it('should migrate the user', async () => {
				const { query } = await setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/migrate-to-oauth2`)
					.send({
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

				const user: User = userFactory.buildWithId({ externalId: 'externalUserId', school });

				const account: Account = accountFactory.buildWithId({
					userId: user.id,
					systemId: sourceSystem.id,
					username: user.email,
				});

				await em.persistAndFlush([sourceSystem, targetSystem, school, user, account, userLoginMigration]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);

				const idToken: string = JwtTestFactory.createJwt({
					sub: 'testUser',
					iss: targetSystem.oauthConfig?.issuer,
					aud: targetSystem.oauthConfig?.clientId,
				});

				mockPostOauthTokenEndpoint(idToken, targetSystem, currentUser.userId, externalId, 'kennung');

				return {
					query,
					user,
					sourceSystem,
					targetSystem,
				};
			};

			it('should throw Internal Server Error', async () => {
				const { query } = await setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/migrate-to-oauth2`)
					.send(query);

				expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
			});
		});

		describe('when authentication of user failed', () => {
			const setup = () => {
				const query: Oauth2MigrationParams = new Oauth2MigrationParams();
				query.code = 'code';
				query.systemId = new ObjectId().toHexString();
				query.redirectUri = 'redirectUri';

				currentUser = undefined;

				return {
					query,
				};
			};

			it('should throw an UnauthorizedException', async () => {
				const { query } = setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/migrate-to-oauth2`)
					.send(query);

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

				const adminRole = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				});

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user, userLoginMigration, adminRole]);

				currentUser = mapUserToCurrentUser(user);

				return {
					user,
				};
			};

			it('should return the Status OK ', async () => {
				const { user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.put(`/user-login-migrations/restart`)
					.query({ userId: user.id });

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should return the response ', async () => {
				const { user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.put(`/user-login-migrations/restart`)
					.query({ userId: user.id });

				expect(response.body).toHaveProperty('startedAt');
				expect(response.body).not.toHaveProperty('closedAt');
				expect(response.body).not.toHaveProperty('finishedAt');
			});
		});

		describe('when current User restart the migration and is not authorized', () => {
			const setup = () => {
				currentUser = undefined;
			};

			it('should return Unauthorized', async () => {
				setup();

				const response: Response = await request(app.getHttpServer())
					.put(`/user-login-migrations/restart`)
					.query({ userId: new ObjectId().toHexString() });

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

				const adminRole = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				});

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user, userLoginMigration]);

				currentUser = mapUserToCurrentUser(user);

				return {
					user,
				};
			};

			it('should return bad request ', async () => {
				const { user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.put(`/user-login-migrations/restart`)
					.query({ userId: user.id });

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

				const adminRole = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				});

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user, userLoginMigration]);

				currentUser = mapUserToCurrentUser(user);

				return {
					user,
				};
			};

			it('should return bad request ', async () => {
				const { user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.put(`/user-login-migrations/restart`)
					.query({ userId: user.id });

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

				const adminRole = roleFactory.buildWithId({
					name: RoleName.ADMINISTRATOR,
					permissions: [Permission.USER_LOGIN_MIGRATION_ADMIN],
				});

				const user: User = userFactory.buildWithId({ school, roles: [adminRole] });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user]);

				currentUser = mapUserToCurrentUser(user);

				return {
					user,
				};
			};

			it('should return a bad request ', async () => {
				const { user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.put(`/user-login-migrations/restart`)
					.query({ userId: user.id });

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});
	});
});
