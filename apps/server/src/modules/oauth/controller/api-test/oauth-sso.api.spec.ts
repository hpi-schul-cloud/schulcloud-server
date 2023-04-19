import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, EntityId, School, System, User } from '@shared/domain';
import {
	accountFactory,
	cleanupCollections,
	mapUserToCurrentUser,
	schoolFactory,
	systemFactory,
	userFactory,
} from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Request } from 'express';
import request, { Response } from 'supertest';
import { UUID } from 'bson';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisResponse, SanisRole } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { JwtTestFactory } from '@shared/testing/factory/jwt.test.factory';
import { SSOAuthenticationError } from '../../interface/sso-authentication-error.enum';
import { OauthTokenResponse } from '../../service/dto';
import { AuthorizationParams, SSOLoginQuery } from '../dto';

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

describe('OAuth SSO Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let axiosMock: MockAdapter;

	const sessionCookieName: string = Configuration.get('SESSION__NAME') as string;
	beforeAll(async () => {
		Configuration.set('PUBLIC_BACKEND_URL', 'http://localhost:3030/api');
		const schulcloudJwt: string = JwtTestFactory.createJwt();

		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					req.headers.authorization = schulcloudJwt;
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

	const setupSessionState = async (systemId: EntityId, migration: boolean) => {
		const query: SSOLoginQuery = {
			migration,
		};

		const response: Response = await request(app.getHttpServer())
			.get(`/sso/login/${systemId}`)
			.query(query)
			.expect(302)
			.expect('set-cookie', new RegExp(`^${sessionCookieName}`));

		const cookies: string[] = response.get('Set-Cookie');
		const redirect: string = response.get('Location');
		const matchState: RegExpMatchArray | null = redirect.match(/(?<=state=)([^&]+)/);
		const state = matchState ? matchState[0] : '';

		return {
			cookies,
			state,
		};
	};

	const setup = async () => {
		const externalUserId = 'externalUserId';
		const system: System = systemFactory.withOauthConfig().buildWithId();
		const school: School = schoolFactory.buildWithId({ systems: [system] });
		const user: User = userFactory.buildWithId({ externalId: externalUserId, school });
		const account: Account = accountFactory.buildWithId({ systemId: system.id, userId: user.id });

		await em.persistAndFlush([system, user, school, account]);
		em.clear();

		const query: AuthorizationParams = new AuthorizationParams();
		query.code = 'code';
		query.state = 'state';

		return {
			system,
			user,
			externalUserId,
			school,
			query,
		};
	};

	describe('[GET] sso/login/:systemId', () => {
		describe('when no error occurs', () => {
			it('should redirect to the authentication url and set a session cookie', async () => {
				const { system } = await setup();

				await request(app.getHttpServer())
					.get(`/sso/login/${system.id}`)
					.expect(302)
					.expect('set-cookie', new RegExp(`^${sessionCookieName}`))
					.expect(
						'Location',
						/^http:\/\/mock.de\/auth\?client_id=12345&redirect_uri=http%3A%2F%2Flocalhost%3A3030%2Fapi%2Fv3%2Fsso%2Foauth&response_type=code&scope=openid\+uuid&state=\w*/
					);
			});
		});

		describe('when an error occurs', () => {
			it('should redirect to the login page', async () => {
				const unknownSystemId: string = new ObjectId().toHexString();
				const clientUrl: string = Configuration.get('HOST') as string;

				await request(app.getHttpServer())
					.get(`/sso/login/${unknownSystemId}`)
					.expect(302)
					.expect('Location', `${clientUrl}/login?error=sso_login_failed`);
			});
		});
	});

	describe('[GET] sso/oauth', () => {
		describe('when the session has no oauthLoginState', () => {
			it('should return 401 Unauthorized', async () => {
				await setup();
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = 'state';

				await request(app.getHttpServer()).get(`/sso/oauth`).query(query).expect(401);
			});
		});

		describe('when the session and the request have a different state', () => {
			it('should return 401 Unauthorized', async () => {
				const { system } = await setup();
				const { cookies } = await setupSessionState(system.id, false);
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = 'wrongState';

				await request(app.getHttpServer()).get(`/sso/oauth`).set('Cookie', cookies).query(query).expect(401);
			});
		});

		describe('when code and state are valid', () => {
			it('should set a jwt and redirect', async () => {
				const { system, externalUserId, query } = await setup();
				const { state, cookies } = await setupSessionState(system.id, false);
				const baseUrl: string = Configuration.get('HOST') as string;
				query.code = 'code';
				query.state = state;

				const idToken: string = JwtTestFactory.createJwt({
					sub: 'testUser',
					iss: system.oauthConfig?.issuer,
					aud: system.oauthConfig?.clientId,
					// For OIDC provisioning strategy
					external_sub: externalUserId,
				});

				axiosMock.onPost(system.oauthConfig?.tokenEndpoint).reply<OauthTokenResponse>(200, {
					id_token: idToken,
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});

				await request(app.getHttpServer())
					.get(`/sso/oauth`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect('Location', `${baseUrl}/dashboard`)
					.expect(
						(res: Response) => res.get('Set-Cookie').filter((value: string) => value.startsWith('jwt')).length === 1
					);
			});
		});

		describe('when an error occurs during the login process', () => {
			it('should redirect to the login page', async () => {
				const { system, query } = await setup();
				const { state, cookies } = await setupSessionState(system.id, false);
				const clientUrl: string = Configuration.get('HOST') as string;
				query.error = SSOAuthenticationError.ACCESS_DENIED;
				query.state = state;

				await request(app.getHttpServer())
					.get(`/sso/oauth`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect('Location', `${clientUrl}/login?error=access_denied`);
			});
		});

		describe('when a faulty query is passed', () => {
			it('should redirect to the login page with an error', async () => {
				const { system, query } = await setup();
				const { state, cookies } = await setupSessionState(system.id, false);
				const clientUrl: string = Configuration.get('HOST') as string;
				query.state = state;
				query.code = undefined;

				await request(app.getHttpServer())
					.get(`/sso/oauth`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect('Location', `${clientUrl}/login?error=sso_auth_code_step`);
			});
		});
	});

	describe('[GET]  sso/oauth/migration', () => {
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

		describe('when the session has no oauthLoginState', () => {
			it('should return 401 Unauthorized', async () => {
				const { query } = await setup();

				await request(app.getHttpServer()).get(`/sso/oauth/migration`).query(query).expect(401);
			});
		});

		describe('when the migration is successful', () => {
			const setupMigration = async () => {
				const { externalUserId, query } = await setup();

				const targetSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS }, new ObjectId().toHexString(), {});
				const sourceSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.ISERV }, new ObjectId().toHexString(), {});

				const sourceSchool: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber: '11111',
					externalId: 'aef1f4fd-c323-466e-962b-a84354c0e713',
					oauthMigrationPossible: new Date('2022-12-17T03:24:00'),
				});

				const targetSchoolExternalId = 'aef1f4fd-c323-466e-962b-a84354c0e714';

				const sourceUser: User = userFactory.buildWithId({ externalId: externalUserId, school: sourceSchool });

				const sourceUserAccount: Account = accountFactory.buildWithId({
					userId: sourceUser.id,
					systemId: sourceSystem.id,
					username: sourceUser.email,
				});

				await em.persistAndFlush([sourceSystem, targetSystem, sourceUser, sourceUserAccount]);

				const { state, cookies } = await setupSessionState(targetSystem.id, true);
				query.code = 'code';
				query.state = state;

				return {
					targetSystem,
					targetSchoolExternalId,
					sourceSystem,
					sourceUser,
					externalUserId,
					query,
					cookies,
				};
			};

			it('should redirect to the success page', async () => {
				const { query, sourceUser, targetSystem, externalUserId, cookies, sourceSystem, targetSchoolExternalId } =
					await setupMigration();
				currentUser = mapUserToCurrentUser(sourceUser, undefined, sourceSystem.id);
				const baseUrl: string = Configuration.get('HOST') as string;

				const idToken: string = JwtTestFactory.createJwt({
					sub: 'testUser',
					iss: targetSystem.oauthConfig?.issuer,
					aud: targetSystem.oauthConfig?.clientId,
					external_sub: externalUserId,
				});

				mockPostOauthTokenEndpoint(idToken, targetSystem, currentUser.userId, targetSchoolExternalId, 'NI_11111');

				await request(app.getHttpServer())
					.get(`/sso/oauth/migration`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect(
						'Location',
						`${baseUrl}/migration/success?sourceSystem=${
							currentUser.systemId ? currentUser.systemId : ''
						}&targetSystem=${targetSystem.id}`
					);
			});
		});

		describe('when currentUser has no systemId', () => {
			const setupMigration = async () => {
				const { externalUserId, query } = await setup();

				const targetSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS }, new ObjectId().toHexString(), {});
				const sourceSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.ISERV }, new ObjectId().toHexString(), {});

				const sourceSchool: School = schoolFactory.buildWithId(
					{
						systems: [sourceSystem],
						officialSchoolNumber: '11110',
						externalId: 'aef1f4fd-c323-466e-962b-a84354c0e713',
						oauthMigrationPossible: new Date('2022-12-17T03:24:00'),
					},
					new ObjectId().toHexString()
				);

				const sourceUser: User = userFactory.buildWithId(
					{ externalId: externalUserId, school: sourceSchool },
					new ObjectId().toHexString(),
					{}
				);

				await em.persistAndFlush([targetSystem, sourceUser]);

				const { state, cookies } = await setupSessionState(targetSystem.id, true);
				query.code = 'code';
				query.state = state;

				return {
					sourceUser,
					query,
					cookies,
				};
			};

			it('should throw UnprocessableEntityException', async () => {
				const { sourceUser, query, cookies } = await setupMigration();
				currentUser = mapUserToCurrentUser(sourceUser, undefined, undefined);
				query.error = SSOAuthenticationError.INVALID_REQUEST;

				await request(app.getHttpServer()).get(`/sso/oauth/migration`).set('Cookie', cookies).query(query).expect(422);
			});
		});

		describe('when invalid request', () => {
			const setupMigration = async () => {
				const { externalUserId, query } = await setup();

				const targetSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS }, new ObjectId().toHexString(), {});
				const sourceSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.ISERV }, new ObjectId().toHexString(), {});

				const sourceSchool: School = schoolFactory.buildWithId(
					{
						systems: [sourceSystem],
						officialSchoolNumber: '11111',
						externalId: 'aef1f4fd-c323-466e-962b-a84354c0e713',
						oauthMigrationPossible: new Date('2022-12-17T03:24:00'),
					},
					new ObjectId().toHexString()
				);

				const sourceUser: User = userFactory.buildWithId(
					{ externalId: externalUserId, school: sourceSchool },
					new ObjectId().toHexString(),
					{}
				);

				await em.persistAndFlush([sourceSystem, targetSystem, sourceSchool, sourceUser]);

				const { state, cookies } = await setupSessionState(targetSystem.id, true);
				query.code = 'code';
				query.state = state;

				return {
					targetSystem,
					sourceSystem,
					sourceUser,
					query,
					cookies,
				};
			};

			it('should redirect to the general migration error page', async () => {
				const { targetSystem, sourceUser, sourceSystem, query, cookies } = await setupMigration();
				currentUser = mapUserToCurrentUser(sourceUser, undefined, sourceSystem.id);
				const baseUrl: string = Configuration.get('HOST') as string;
				query.error = SSOAuthenticationError.INVALID_REQUEST;

				await request(app.getHttpServer())
					.get(`/sso/oauth/migration`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect(
						'Location',
						`${baseUrl}/migration/error?sourceSystem=${sourceSystem.id}&targetSystem=${targetSystem.id}`
					);
			});
		});

		describe('when schoolnumbers mismatch', () => {
			const setupMigration = async () => {
				const { externalUserId, query } = await setup();

				const targetSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS }, new ObjectId().toHexString(), {});
				const sourceSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.ISERV }, new ObjectId().toHexString(), {});

				const sourceSchool: School = schoolFactory.buildWithId(
					{
						systems: [sourceSystem],
						officialSchoolNumber: '11111',
						externalId: 'aef1f4fd-c323-466e-962b-a84354c0e713',
						oauthMigrationPossible: new Date('2022-12-17T03:24:00'),
					},
					new ObjectId().toHexString()
				);

				const targetSchool: School = schoolFactory.buildWithId(
					{
						systems: [targetSystem],
						officialSchoolNumber: '22222',
						externalId: 'aef1f4fd-c323-466e-962b-a84354c0e713',
					},
					new ObjectId().toHexString(),
					{}
				);

				const sourceUser: User = userFactory.buildWithId(
					{ externalId: externalUserId, school: sourceSchool },
					new ObjectId().toHexString(),
					{}
				);

				const targetUser: User = userFactory.buildWithId({
					externalId: 'differentExternalUserId',
					school: targetSchool,
				});

				await em.persistAndFlush([sourceSystem, targetSystem, sourceUser, targetUser]);

				const { state, cookies } = await setupSessionState(targetSystem.id, true);
				query.code = 'code';
				query.state = state;

				return {
					targetSystem,
					sourceSystem,
					sourceUser,
					targetUser,
					targetSchoolExternalId: targetSchool.externalId as string,
					query,
					cookies,
				};
			};

			it('should redirect to the login page with an schoolnumber mismatch error', async () => {
				const { targetSystem, sourceUser, targetUser, sourceSystem, targetSchoolExternalId, query, cookies } =
					await setupMigration();
				currentUser = mapUserToCurrentUser(sourceUser, undefined, sourceSystem.id);
				const baseUrl: string = Configuration.get('HOST') as string;

				const idToken: string = JwtTestFactory.createJwt({
					sub: 'differentExternalUserId',
					iss: targetSystem.oauthConfig?.issuer,
					aud: targetSystem.oauthConfig?.clientId,
					external_sub: 'differentExternalUserId',
				});

				mockPostOauthTokenEndpoint(idToken, targetSystem, targetUser.id, targetSchoolExternalId, 'NI_22222');

				await request(app.getHttpServer())
					.get(`/sso/oauth/migration`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect(
						'Location',
						`${baseUrl}/migration/error?sourceSystem=${sourceSystem.id}&targetSystem=${targetSystem.id}&sourceSchoolNumber=11111&targetSchoolNumber=22222`
					);
			});
		});

		afterAll(() => {
			axiosMock.restore();
		});
	});
});
