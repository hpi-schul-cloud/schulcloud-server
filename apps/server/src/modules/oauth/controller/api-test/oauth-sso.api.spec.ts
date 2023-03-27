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
import crypto, { KeyPairKeyObjectResult } from 'crypto';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import request, { Response } from 'supertest';
import { UUID } from 'bson';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SanisResponse, SanisRole } from '@src/modules/provisioning/strategy/sanis/sanis.response';
import { SSOAuthenticationError } from '../../interface/sso-authentication-error.enum';
import { OauthTokenResponse } from '../../service/dto';
import { AuthorizationParams, SSOLoginQuery } from '../dto';

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
	let currentUser: ICurrentUser;
	let axiosMock: MockAdapter;

	const sessionCookieName: string = Configuration.get('SESSION__NAME') as string;

	beforeAll(async () => {
		Configuration.set('PUBLIC_BACKEND_URL', 'http://localhost:3030/api');

		const schulcloudJwt: string = jwt.sign(
			{
				sub: 'testUser',
				accountId: 'accountId',
				jti: 'jti',
			},
			privateKey,
			{
				algorithm: 'RS256',
			}
		);

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

	const setup = async () => {
		const externalUserId = 'externalUserId';
		const system: System = systemFactory.withOauthConfig().buildWithId();
		const school: School = schoolFactory.buildWithId({ systems: [system] });
		const user: User = userFactory.buildWithId({ externalId: externalUserId, school });
		const account: Account = accountFactory.buildWithId({ systemId: system.id, userId: user.id });

		const targetSystem: System = systemFactory
			.withOauthConfig()
			.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS }, '5bf142459b72e12b2b1b2cde', {});
		const sourceSystem: System = systemFactory
			.withOauthConfig()
			.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.ISERV }, '5bf142459b72e12b2b1b2ee1', {});

		const sourceSchool: School = schoolFactory.buildWithId(
			{
				systems: [sourceSystem],
				officialSchoolNumber: '11111',
				externalId: 'aef1f4fd-c323-466e-962b-a84354c0e713',
				oauthMigrationPossible: new Date('2022-12-17T03:24:00'),
			},
			'55153a8014829a865bbf700a'
		);

		const targetSchool: School = schoolFactory.buildWithId(
			{ systems: [targetSystem], officialSchoolNumber: '22222', externalId: 'targetExternalId' },
			'55153a8014829a865bbf700d',
			{}
		);

		const sourceUser: User = userFactory.buildWithId(
			{ externalId: externalUserId, school: sourceSchool },
			'641c7321a7495d7b48926508',
			{}
		);
		const targetUser: User = userFactory.buildWithId({ externalId: 'differentExternalUserId', school: targetSchool });

		await em.persistAndFlush([
			system,
			user,
			school,
			account,
			sourceSystem,
			targetSystem,
			sourceSchool,
			targetSchool,
			sourceUser,
			targetUser,
		]);
		em.clear();

		return {
			system,
			user,
			externalUserId,
			school,
			targetSystem,
			sourceSystem,
			sourceUser,
			targetUser,
		};
	};

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
				const { system, externalUserId } = await setup();
				const { state, cookies } = await setupSessionState(system.id, false);
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
						external_sub: externalUserId,
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
				const { system } = await setup();
				const { state, cookies } = await setupSessionState(system.id, false);
				const clientUrl: string = Configuration.get('HOST') as string;
				const query: AuthorizationParams = new AuthorizationParams();
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
				const { system } = await setup();
				const { state, cookies } = await setupSessionState(system.id, false);
				const clientUrl: string = Configuration.get('HOST') as string;
				const query: AuthorizationParams = new AuthorizationParams();
				query.state = state;

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
		describe('when the session has no oauthLoginState', () => {
			it('should return 401 Unauthorized', async () => {
				await setup();
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = 'state';

				await request(app.getHttpServer()).get(`/sso/oauth/migration`).query(query).expect(401);
			});
		});

		describe('when the migration is successful', () => {
			it('should redirect to the success page', async () => {
				const { user, system, externalUserId } = await setup();
				currentUser = mapUserToCurrentUser(user, undefined, system.id);
				const { state, cookies } = await setupSessionState(system.id, true);
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
						external_sub: externalUserId,
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
					.get(`/sso/oauth/migration`)
					.set('Cookie', cookies)
					.query(query)
					.expect(302)
					.expect(
						'Location',
						`${baseUrl}/migration/success?sourceSystem=${system.id}&targetSystem=${
							currentUser.systemId ? currentUser.systemId : ''
						}`
					);
			});
		});

		describe('when invalid request', () => {
			it('should throw UnprocessableEntityException', async () => {
				const { targetSystem, sourceUser } = await setup();
				currentUser = mapUserToCurrentUser(sourceUser, undefined, undefined);
				const { state, cookies } = await setupSessionState(targetSystem.id, true);
				const query: AuthorizationParams = new AuthorizationParams();
				query.error = SSOAuthenticationError.INVALID_REQUEST;
				query.state = state;

				await request(app.getHttpServer()).get(`/sso/oauth/migration`).set('Cookie', cookies).query(query).expect(422);
			});
		});

		describe('when invalid request', () => {
			it('should redirect to the general migration error page', async () => {
				const { targetSystem, sourceUser, sourceSystem } = await setup();
				currentUser = mapUserToCurrentUser(sourceUser, undefined, sourceSystem.id);
				const { state, cookies } = await setupSessionState(targetSystem.id, true);
				const baseUrl: string = Configuration.get('HOST') as string;

				const query: AuthorizationParams = new AuthorizationParams();
				query.error = SSOAuthenticationError.INVALID_REQUEST;
				query.state = state;

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
			it('should redirect to the login page with an schoolnumber mismatch error', async () => {
				const { targetSystem, sourceUser, targetUser, sourceSystem } = await setup();
				currentUser = mapUserToCurrentUser(sourceUser, undefined, sourceSystem.id);
				const { state, cookies } = await setupSessionState(targetSystem.id, true);
				const baseUrl: string = Configuration.get('HOST') as string;
				const query: AuthorizationParams = new AuthorizationParams();
				query.code = 'code';
				query.state = state;

				const idToken: string = jwt.sign(
					{
						sub: 'differentExternalUserId',
						iss: targetSystem.oauthConfig?.issuer,
						aud: targetSystem.oauthConfig?.clientId,
						iat: Date.now(),
						exp: Date.now() + 100000,
						external_sub: 'differentExternalUserId',
					},
					privateKey,
					{
						algorithm: 'RS256',
					}
				);

				axiosMock
					.onPost(targetSystem.oauthConfig?.tokenEndpoint)
					.replyOnce<OauthTokenResponse>(200, {
						id_token: idToken,
						refresh_token: 'refreshToken',
						access_token: 'accessToken',
					})
					.onGet(targetSystem.provisioningUrl)
					.replyOnce<SanisResponse>(200, {
						pid: targetUser.id,
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
									kennung: 'NI_22222',
									name: 'schulName',
									typ: 'not necessary',
								},
								personenstatus: 'not necessary',
								email: 'email',
							},
						],
					});

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
