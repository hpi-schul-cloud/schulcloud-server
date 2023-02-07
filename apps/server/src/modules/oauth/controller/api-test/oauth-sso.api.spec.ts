import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, EntityId, School, System, User } from '@shared/domain';
import { accountFactory, cleanupCollections, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import crypto, { KeyPairKeyObjectResult } from 'crypto';
import jwt from 'jsonwebtoken';
import request, { Response } from 'supertest';
import { AuthorizationParams, OauthTokenResponse } from '../dto';

const keyPair: KeyPairKeyObjectResult = crypto.generateKeyPairSync('rsa', { modulusLength: 4096 });
const publicKey: string | Buffer = keyPair.publicKey.export({ type: 'pkcs1', format: 'pem' });
const privateKey: string | Buffer = keyPair.privateKey.export({ type: 'pkcs1', format: 'pem' });

jest.mock('jwks-rsa', () => () => {
	return {
		getKeys: jest.fn(),
		getSigningKey: jest.fn().mockResolvedValue({
			kid: 'kid',
			alg: 'RS256',
			getPublicKey: jest.fn().mockReturnValue(publicKey),
			rsaPublicKey: publicKey,
		}),
		getSigningKeys: jest.fn(),
	};
});

describe('OAuth SSO Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let axiosMock: MockAdapter;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		axiosMock = new MockAdapter(axios);
		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	const setup = async () => {
		const externalUserId = 'externalUserId';
		const system: System = systemFactory.withOauthConfig().buildWithId();
		const school: School = schoolFactory.buildWithId({ systems: [system] });
		const user: User = userFactory.buildWithId({ externalId: externalUserId, school });
		const account: Account = accountFactory.buildWithId({ systemId: system.id, userId: user.id });

		await em.persistAndFlush([system, user, school, account]);
		em.clear();

		return {
			system,
			user,
			externalUserId,
		};
	};

	describe('[GET] sso/login/:systemId', () => {
		it('should redirect to the authentication url and set a session cookie', async () => {
			const { system } = await setup();

			await request(app.getHttpServer())
				.get(`/sso/login/${system.id}`)
				.expect(302)
				.expect('set-cookie', /connect.sid/)
				.expect(
					'Location',
					/^http:\/\/mock.de\/auth\?client_id=12345&redirect_uri=http%3A%2F%2Fmockhost%3A3030%2Fapi%2Fv3%2Fsso%2Foauth%2FtestsystemId&response_type=code&scope=openid\+uuid&state=\w*/
				);
		});
	});

	describe('[GET] sso/oauth/:systemId', () => {
		const setupSessionState = async (systemId: EntityId) => {
			const response: Response = await request(app.getHttpServer())
				.get(`/sso/login/${systemId}`)
				.expect(302)
				.expect('set-cookie', /connect.sid/);

			const cookies: string[] = response.get('Set-Cookie');
			const redirect: string = response.get('Location');
			const matchState: RegExpMatchArray | null = redirect.match(/(?<=state=)([^&]+)/);
			const state = matchState ? matchState[0] : '';

			return {
				cookies,
				state,
			};
		};

		describe('when the session has no oauthLoginState', () => {
			it('should return 401 Unauthorized', async () => {
				const { system } = await setup();
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = 'state';

				await request(app.getHttpServer()).get(`/sso/oauth/${system.id}`).query(query).expect(401);
			});
		});

		describe('when the session and the request have a different state', () => {
			it('should return 401 Unauthorized', async () => {
				const { system } = await setup();
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = 'wrongState';

				await request(app.getHttpServer()).get(`/sso/login/${system.id}`).expect(302);
				await request(app.getHttpServer()).get(`/sso/oauth/${system.id}`).query(query).expect(401);
			});
		});

		describe('when code and state are valid', () => {
			it('should set a jwt and redirect', async () => {
				const { system, externalUserId } = await setup();
				const { state, cookies } = await setupSessionState(system.id);
				const baseUrl: string = Configuration.get('HOST') as string;
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = state;

				const idToken: string = jwt.sign(
					{
						sub: 'testUser',
						iss: system.oauthConfig?.issuer,
						aud: system.oauthConfig?.clientId,
						iat: Date.now(),
						exp: Date.now() + 100000,
						preferred_username: externalUserId,
					},
					privateKey,
					{
						algorithm: 'RS256',
					}
				);

				axiosMock.onPost(system.oauthConfig?.tokenEndpoint).reply<OauthTokenResponse>(200, {
					id_token: idToken,
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});

				await request(app.getHttpServer())
					.get(`/sso/oauth/${system.id}`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect('Location', `${baseUrl}/dashboard`)
					.expect(
						(res: Response) => res.get('Set-Cookie').filter((value: string) => value.startsWith('jwt')).length === 1
					);
			});
		});

		describe('when code and state are valid', () => {
			it('should set a jwt and redirect', async () => {
				const { system } = await setup();
				const { state, cookies } = await setupSessionState(system.id);
				const baseUrl: string = Configuration.get('HOST') as string;
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = state;

				await request(app.getHttpServer())
					.get(`/sso/oauth/${system.id}`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect('Location', `${baseUrl}/login?error=123&provider=mock_type`);
			});
		});
	});
});
