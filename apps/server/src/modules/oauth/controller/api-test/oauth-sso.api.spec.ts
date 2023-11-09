import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { KeycloakAdministrationService } from '@infra/identity-management/keycloak-administration/service/keycloak-administration.service';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '@modules/authentication';
import { JwtAuthGuard } from '@modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@modules/server';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, EntityId, SchoolEntity, SystemEntity, User } from '@shared/domain';
import { accountFactory, cleanupCollections, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { JwtTestFactory } from '@shared/testing/factory/jwt.test.factory';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Request } from 'express';
import request, { Response } from 'supertest';
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
		const kcAdminService = app.get(KeycloakAdministrationService);

		axiosMock.onGet(kcAdminService.getWellKnownUrl()).reply(200, {
			issuer: 'issuer',
			token_endpoint: 'token_endpoint',
			authorization_endpoint: 'authorization_endpoint',
			end_session_endpoint: 'end_session_endpoint',
			jwks_uri: 'jwks_uri',
		});
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
		const system: SystemEntity = systemFactory.withOauthConfig().buildWithId();
		const school: SchoolEntity = schoolFactory.buildWithId({ systems: [system] });
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
					.expect(
						'Location',
						`${clientUrl}/login?error=access_denied&provider=${system.oauthConfig?.provider as string}`
					);
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
					.expect(
						'Location',
						`${clientUrl}/login?error=sso_auth_code_step&provider=${system.oauthConfig?.provider as string}`
					);
			});
		});
	});
});
