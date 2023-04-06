import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { School, System, User } from '@shared/domain';
import { cleanupCollections, mapUserToCurrentUser, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { ServerTestModule } from '@src/modules/server';
import { Request } from 'express';
import request, { Response } from 'supertest';
import jwt from 'jsonwebtoken';
import crypto, { KeyPairKeyObjectResult } from 'crypto';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { UUID } from 'bson';
import { SSOErrorCode } from '../../../oauth/error/sso-error-code.enum';
import { OauthTokenResponse } from '../../../oauth/service/dto';
import { SanisResponse, SanisRole } from '../../../provisioning/strategy/sanis/sanis.response';

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

describe('UserLoginMigrationController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;

	let currentUser: ICurrentUser | undefined;
	let schulcloudJwt: string | undefined;

	beforeAll(async () => {
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
					oauthMigrationStart: date,
					oauthMigrationFinished: date,
					oauthMigrationFinalFinish: date,
					oauthMigrationMandatory: date,
					systems: [sourceSystem],
				});
				const user: User = userFactory.buildWithId({ school });

				await em.persistAndFlush([sourceSystem, targetSystem, school, user]);

				currentUser = mapUserToCurrentUser(user);

				return {
					sourceSystem,
					targetSystem,
					school,
					user,
				};
			};

			it('should return the users migration', async () => {
				const { sourceSystem, targetSystem, school, user } = await setup();

				const response: Response = await request(app.getHttpServer())
					.get(`/user-login-migrations`)
					.query({ userId: user.id });

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					data: [
						{
							sourceSystemId: sourceSystem.id,
							targetSystemId: targetSystem.id,
							startedAt: school.oauthMigrationStart?.toISOString(),
							closedAt: school.oauthMigrationFinished?.toISOString(),
							finishedAt: school.oauthMigrationFinalFinish?.toISOString(),
							mandatorySince: school.oauthMigrationMandatory?.toISOString(),
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

	describe('[GET] /user-login-migrations/migrate-to-oauth2', () => {
		describe('when providing a code and being eligible to migrate', () => {
			const setup = async () => {
				const sourceSystem: System = systemFactory.buildWithId();
				const targetSystem: System = systemFactory
					.withOauthConfig()
					.buildWithId({ provisioningStrategy: SystemProvisioningStrategy.SANIS });

				const officialSchoolNumber = '12345';
				const school: School = schoolFactory.buildWithId({
					systems: [sourceSystem],
					officialSchoolNumber,
					externalId: 'oldSchoolExternalId',
				});

				const user: User = userFactory.buildWithId({ externalId: 'oldUserExternalId', school });

				await em.persistAndFlush([user, sourceSystem, targetSystem, school]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				schulcloudJwt = jwt.sign(
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

				const idToken: string = jwt.sign(
					{
						sub: 'testUser',
						iss: targetSystem.oauthConfig?.issuer,
						aud: targetSystem.oauthConfig?.clientId,
						iat: Date.now(),
						exp: Date.now() + 100000,
					},
					privateKey,
					{
						algorithm: 'RS256',
					}
				);

				const axiosMock = new MockAdapter(axios);
				axiosMock
					.onPost(targetSystem.oauthConfig?.tokenEndpoint)
					.replyOnce<OauthTokenResponse>(200, {
						id_token: idToken,
						refresh_token: 'refreshToken',
						access_token: 'accessToken',
					})
					.onGet(targetSystem.provisioningUrl)
					.replyOnce<SanisResponse>(200, {
						pid: new UUID('aef1f4fd-c323-466e-962b-a84354c0e715').toString(),
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

				return {
					sourceSystem,
					targetSystem,
				};
			};

			it('should migrate the user', async () => {
				const { targetSystem } = await setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/migrate-to-oauth2`)
					.send({
						redirectUri: 'redirectUri',
						code: 'code',
						systemId: targetSystem.id,
					});

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});

		describe('when providing an error', () => {
			const setup = () => {
				const user: User = userFactory.buildWithId();

				currentUser = mapUserToCurrentUser(user);
				schulcloudJwt = jwt.sign(
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
			};

			it('should throw an error?', async () => {
				setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/migrate-to-oauth2`)
					.send({
						redirectUri: 'redirectUri',
						error: SSOErrorCode.SSO_OAUTH_LOGIN_FAILED,
						systemId: new ObjectId().toHexString(),
					});

				expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
			});
		});

		describe('when being unauthorized', () => {
			const setup = () => {
				currentUser = undefined;
			};

			it('should throw an UnauthorizedException', async () => {
				setup();

				const response: Response = await request(app.getHttpServer())
					.post(`/user-login-migrations/migrate-to-oauth2`)
					.send({
						redirectUri: 'redirectUri',
						code: 'code',
						systemId: new ObjectId().toHexString(),
					});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
