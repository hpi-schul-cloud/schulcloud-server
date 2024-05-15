import { EntityManager } from '@mikro-orm/core';
import { OauthTokenResponse } from '@modules/oauth/service/dto';
import { ServerTestModule } from '@modules/server/server.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity, SystemEntity, User } from '@shared/domain/entity';
import { RoleName } from '@shared/domain/interface';
import { roleFactory, schoolEntityFactory, systemEntityFactory, userFactory } from '@shared/testing';
import { AccountEntity } from '@src/modules/account/domain/entity/account.entity';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import crypto, { KeyPairKeyObjectResult } from 'crypto';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import request, { Response } from 'supertest';
import { ICurrentUser } from '../../interface';
import { LdapAuthorizationBodyParams, LocalAuthorizationBodyParams, OauthLoginResponse } from '../dto';
import { accountFactory } from '@src/modules/account/testing';

const ldapAccountUserName = 'ldapAccountUserName';
const mockUserLdapDN = 'mockUserLdapDN';

const keyPair: KeyPairKeyObjectResult = crypto.generateKeyPairSync('rsa', { modulusLength: 4096 });
const publicKey: string | Buffer = keyPair.publicKey.export({ type: 'pkcs1', format: 'pem' });
const privateKey: string | Buffer = keyPair.privateKey.export({ type: 'pkcs1', format: 'pem' });

// It is not completely end-to-end
// LDAP client is mocked because no suitable LDAP server exists in test environment.
const mockClient = {
	connected: false,
	on(eventName: string, callback: () => unknown) {
		callback();
	},
	bind(username, password, callback: (error?: unknown) => unknown) {
		if (username === mockUserLdapDN) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			this.connected = true;
			callback();
		}
		callback('an error');
	},
	unbind() {},
};

jest.mock('ldapjs', () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const originalModule = jest.requireActual('ldapjs');

	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return {
		__esModule: true,
		...originalModule,
		createClient: () => {
			return { ...mockClient };
		},
	};
});

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

describe('Login Controller (api)', () => {
	const basePath = '/authentication';

	let app: INestApplication;
	let em: EntityManager;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	afterAll(async () => {
		// await cleanupCollections(em);
		await app.close();
	});

	describe('loginLocal', () => {
		let account: AccountEntity;
		let user: User;

		beforeAll(async () => {
			const school = schoolEntityFactory.buildWithId();
			const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

			user = userFactory.buildWithId({ school, roles: [studentRoles] });
			account = accountFactory.buildWithId({
				userId: user.id,
				username: user.email,
				password: defaultPasswordHash,
				deactivatedAt: moment().add(1, 'd').toDate(),
			});

			em.persist(school);
			em.persist(studentRoles);
			em.persist(user);
			em.persist(account);
			await em.flush();
		});

		describe('when user login succeeds', () => {
			it('should return jwt', async () => {
				const params: LocalAuthorizationBodyParams = {
					username: user.email,
					password: defaultPassword,
				};
				const response = await request(app.getHttpServer()).post(`${basePath}/local`).send(params).expect(200);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				const token = response.body.accessToken;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const decodedToken = jwt.decode(token);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body.accessToken).toBeDefined();
				expect(decodedToken).toHaveProperty('userId');
				expect(decodedToken).toHaveProperty('accountId');
				expect(decodedToken).toHaveProperty('schoolId');
				expect(decodedToken).toHaveProperty('roles');
				expect(decodedToken).not.toHaveProperty('externalIdToken');
			});
		});

		describe('when user login fails', () => {
			it('should return error response', async () => {
				const params = {
					username: user.email,
					password: 'wrongPassword',
				};
				await request(app.getHttpServer()).post(`${basePath}/local`).send(params).expect(401);
			});
		});
		describe('when user login fails cause account is deactivated', () => {
			const setup = async () => {
				const newUser: User = userFactory.buildWithId();
				const deactivatedAccount: AccountEntity = accountFactory.buildWithId({
					userId: newUser.id,
					username: newUser.email,
					password: defaultPasswordHash,
					deactivatedAt: new Date(),
				});

				em.persist(newUser);
				em.persist(deactivatedAccount);
				await em.flush();
				return { newUser };
			};
			it('should return error response', async () => {
				const { newUser } = await setup();
				const params = {
					username: newUser.email,
					password: defaultPassword,
				};
				await request(app.getHttpServer()).post(`${basePath}/local`).send(params).expect(401);
			});
		});
	});

	describe('loginLdap', () => {
		describe('when user login succeeds', () => {
			const setup = async () => {
				const schoolExternalId = 'mockSchoolExternalId';
				const system: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({});
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
					externalId: schoolExternalId,
				});
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

				const user: User = userFactory.buildWithId({ school, roles: [studentRoles], ldapDn: mockUserLdapDN });

				const account: AccountEntity = accountFactory.buildWithId({
					userId: user.id,
					username: `${schoolExternalId}/${ldapAccountUserName}`.toLowerCase(),
					systemId: system.id,
					deactivatedAt: moment().add(1, 'd').toDate(),
				});

				await em.persistAndFlush([system, school, studentRoles, user, account]);

				const params: LdapAuthorizationBodyParams = {
					username: ldapAccountUserName,
					password: defaultPassword,
					schoolId: school.id,
					systemId: system.id,
				};

				return {
					params,
				};
			};

			it('should return jwt', async () => {
				const { params } = await setup();

				const response = await request(app.getHttpServer()).post(`${basePath}/ldap`).send(params);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
				const token = response.body.accessToken;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const decodedToken = jwt.decode(token);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body.accessToken).toBeDefined();
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body.accessToken).toBeDefined();
				expect(decodedToken).toHaveProperty('userId');
				expect(decodedToken).toHaveProperty('accountId');
				expect(decodedToken).toHaveProperty('schoolId');
				expect(decodedToken).toHaveProperty('roles');
				expect(decodedToken).toHaveProperty('isExternalUser');
				expect(decodedToken).not.toHaveProperty('externalIdToken');
			});
		});

		describe('when user login fails', () => {
			const setup = async () => {
				const schoolExternalId = 'mockSchoolExternalId';
				const system: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({});
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
					externalId: schoolExternalId,
				});
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

				const user: User = userFactory.buildWithId({ school, roles: [studentRoles], ldapDn: mockUserLdapDN });

				const account: AccountEntity = accountFactory.buildWithId({
					userId: user.id,
					username: `${schoolExternalId}/${ldapAccountUserName}`.toLowerCase(),
					systemId: system.id,
				});

				await em.persistAndFlush([system, school, studentRoles, user, account]);

				const params: LdapAuthorizationBodyParams = {
					username: 'nonExistentUser',
					password: 'wrongPassword',
					schoolId: school.id,
					systemId: system.id,
				};

				return {
					params,
				};
			};

			it('should return error response', async () => {
				const { params } = await setup();

				const response = await request(app.getHttpServer()).post(`${basePath}/ldap`).send(params);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user login fails because account is deactivated', () => {
			const setup = async () => {
				const schoolExternalId = 'mockSchoolExternalId';
				const system: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({});
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
					externalId: schoolExternalId,
				});
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

				const user: User = userFactory.buildWithId({ school, roles: [studentRoles], ldapDn: mockUserLdapDN });

				const account: AccountEntity = accountFactory.buildWithId({
					userId: user.id,
					username: `${schoolExternalId}/${ldapAccountUserName}`.toLowerCase(),
					systemId: system.id,
					deactivatedAt: new Date(),
				});

				await em.persistAndFlush([system, school, studentRoles, user, account]);

				const params: LdapAuthorizationBodyParams = {
					username: ldapAccountUserName,
					password: defaultPassword,
					schoolId: school.id,
					systemId: system.id,
				};

				return {
					params,
				};
			};

			it('should return error response', async () => {
				const { params } = await setup();

				const response = await request(app.getHttpServer()).post(`${basePath}/ldap`).send(params);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when logging in as a user of the Central LDAP of Brandenburg', () => {
			const setup = async () => {
				const officialSchoolNumber = '01234';
				const system: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({});
				const school: SchoolEntity = schoolEntityFactory.buildWithId({
					systems: [system],
					externalId: officialSchoolNumber,
					officialSchoolNumber,
				});
				const studentRole = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

				const user: User = userFactory.buildWithId({ school, roles: [studentRole], ldapDn: mockUserLdapDN });

				const account: AccountEntity = accountFactory.buildWithId({
					userId: user.id,
					username: `${officialSchoolNumber}/${ldapAccountUserName}`.toLowerCase(),
					systemId: system.id,
				});

				await em.persistAndFlush([system, school, studentRole, user, account]);

				const params: LdapAuthorizationBodyParams = {
					username: ldapAccountUserName,
					password: defaultPassword,
					schoolId: school.id,
					systemId: system.id,
				};

				return {
					params,
					user,
					account,
					school,
					system,
					studentRole,
				};
			};

			it('should return a jwt', async () => {
				const { params, user, account, school, system, studentRole } = await setup();

				const response = await request(app.getHttpServer()).post(`${basePath}/ldap`).send(params);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body.accessToken).toBeDefined();
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
				const decodedToken = jwt.decode(response.body.accessToken);
				expect(decodedToken).toMatchObject<ICurrentUser>({
					userId: user.id,
					systemId: system.id,
					roles: [studentRole.id],
					schoolId: school.id,
					accountId: account.id,
					isExternalUser: true,
				});
				expect(decodedToken).not.toHaveProperty('externalIdToken');
			});
		});
	});

	describe('loginOauth2', () => {
		describe('when a valid code is provided', () => {
			const setup = async (inputExternalId: string) => {
				const schoolExternalId = 'schoolExternalId';
				const userExternalId = inputExternalId;

				const system = systemEntityFactory.withOauthConfig().buildWithId({});
				const school = schoolEntityFactory.buildWithId({ systems: [system], externalId: schoolExternalId });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const user = userFactory.buildWithId({ school, roles: [studentRoles], externalId: userExternalId });
				const account = accountFactory.buildWithId({
					userId: user.id,
					systemId: system.id,
					deactivatedAt: moment().add(1, 'd').toDate(),
				});

				await em.persistAndFlush([system, school, studentRoles, user, account]);
				em.clear();

				const idToken: string = jwt.sign(
					{
						sub: 'testUser',
						iss: system.oauthConfig?.issuer,
						aud: system.oauthConfig?.clientId,
						iat: Date.now(),
						exp: Date.now() + 100000,
						// For OIDC provisioning strategy
						external_sub: userExternalId,
					},
					privateKey,
					{
						algorithm: 'RS256',
					}
				);

				const axiosMock: MockAdapter = new MockAdapter(axios);

				axiosMock.onPost(system.oauthConfig?.tokenEndpoint).reply<OauthTokenResponse>(200, {
					id_token: idToken,
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});

				return {
					system,
					idToken,
				};
			};

			it('should return oauth login response', async () => {
				const { system, idToken } = await setup('userExternalId');

				const response: Response = await request(app.getHttpServer())
					.post(`${basePath}/oauth2`)
					.send({
						redirectUri: 'redirectUri',
						code: 'code',
						systemId: system.id,
					})
					.expect(HttpStatus.OK);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body).toEqual<OauthLoginResponse>({
					accessToken: expect.any(String),
					externalIdToken: idToken,
				});
			});

			it('should return a valid jwt as access token', async () => {
				const { system } = await setup('newUserExternalId');

				const response: Response = await request(app.getHttpServer())
					.post(`${basePath}/oauth2`)
					.send({
						redirectUri: 'redirectUri',
						code: 'code',
						systemId: system.id,
					})
					.expect(HttpStatus.OK);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
				const decodedToken = jwt.decode(response.body.accessToken);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body.accessToken).toBeDefined();
				expect(decodedToken).toHaveProperty('userId');
				expect(decodedToken).toHaveProperty('accountId');
				expect(decodedToken).toHaveProperty('schoolId');
				expect(decodedToken).toHaveProperty('roles');
				expect(decodedToken).not.toHaveProperty('externalIdToken');
			});
		});
		describe('when a valid code is provided with deactivated account', () => {
			const setup = async (inputExternalId: string) => {
				const schoolExternalId = 'schoolExternalId';
				const userExternalId = inputExternalId;

				const system = systemEntityFactory.withOauthConfig().buildWithId({});
				const school = schoolEntityFactory.buildWithId({ systems: [system], externalId: schoolExternalId });
				const teacherRoles = roleFactory.build({ name: RoleName.TEACHER, permissions: [] });
				const user = userFactory.buildWithId({ school, roles: [teacherRoles], externalId: userExternalId });
				const account = accountFactory.buildWithId({
					userId: user.id,
					systemId: system.id,
					deactivatedAt: new Date(),
				});

				await em.persistAndFlush([system, school, teacherRoles, user, account]);

				const idToken: string = jwt.sign(
					{
						sub: 'testUser2',
						iss: system.oauthConfig?.issuer,
						aud: system.oauthConfig?.clientId,
						iat: Date.now(),
						exp: Date.now() + 100000,
						// For OIDC provisioning strategy
						external_sub: userExternalId,
					},
					privateKey,
					{
						algorithm: 'RS256',
					}
				);

				const axiosMock: MockAdapter = new MockAdapter(axios);

				axiosMock.onPost(system.oauthConfig?.tokenEndpoint).reply<OauthTokenResponse>(200, {
					id_token: idToken,
					refresh_token: 'refreshToken',
					access_token: 'accessToken',
				});

				return {
					system,
					idToken,
				};
			};

			it('should return error response', async () => {
				const { system } = await setup('user2ExternalId');

				const response: Response = await request(app.getHttpServer()).post(`${basePath}/oauth2`).send({
					redirectUri: 'redirectUri',
					code: 'code',
					systemId: system.id,
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
