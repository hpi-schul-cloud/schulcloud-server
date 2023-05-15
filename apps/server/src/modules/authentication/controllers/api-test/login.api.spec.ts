import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, RoleName, School, System, User } from '@shared/domain';
import { accountFactory, roleFactory, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { SSOErrorCode } from '@src/modules/oauth/error/sso-error-code.enum';
import { OauthTokenResponse } from '@src/modules/oauth/service/dto';
import { ServerTestModule } from '@src/modules/server/server.module';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import crypto, { KeyPairKeyObjectResult } from 'crypto';
import jwt from 'jsonwebtoken';
import request, { Response } from 'supertest';
import { LdapAuthorizationBodyParams, LocalAuthorizationBodyParams } from '../dto';

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
		let account: Account;
		let user: User;

		beforeAll(async () => {
			const school = schoolFactory.buildWithId();
			const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

			user = userFactory.buildWithId({ school, roles: [studentRoles] });
			account = accountFactory.buildWithId({
				userId: user.id,
				username: user.email,
				password: defaultPasswordHash,
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
	});

	describe('loginLdap', () => {
		let account: Account;
		let user: User;
		let school: School;
		let system: System;

		beforeAll(async () => {
			const ldapRootPath = 'rootPath';
			const schoolExternalId = 'mockSchoolExternalId';
			system = systemFactory.withLdapConfig({ rootPath: ldapRootPath }).buildWithId({});
			school = schoolFactory.buildWithId({ systems: [system], externalId: schoolExternalId });
			const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

			user = userFactory.buildWithId({ school, roles: [studentRoles], ldapDn: mockUserLdapDN });

			account = accountFactory.buildWithId({
				userId: user.id,
				username: `${ldapRootPath}/${ldapAccountUserName}`.toLowerCase(),
				systemId: system.id,
			});

			em.persist(system);
			em.persist(school);
			em.persist(studentRoles);
			em.persist(user);
			em.persist(account);
			await em.flush();
		});

		describe('when user login succeeds', () => {
			it('should return jwt', async () => {
				const params: LdapAuthorizationBodyParams = {
					username: ldapAccountUserName,
					password: defaultPassword,
					schoolId: school.id,
					systemId: system.id,
				};
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
			});
		});

		describe('when user login fails', () => {
			it('should return error response', async () => {
				const params: LdapAuthorizationBodyParams = {
					username: 'nonExistentUser',
					password: 'wrongPassword',
					schoolId: school.id,
					systemId: system.id,
				};
				await request(app.getHttpServer()).post(`${basePath}/ldap`).send(params).expect(401);
			});
		});
	});

	describe('loginOauth2', () => {
		describe('when a valid code is provided', () => {
			const setup = async () => {
				const schoolExternalId = 'schoolExternalId';
				const userExternalId = 'userExternalId';

				const system = systemFactory.withOauthConfig().buildWithId({});
				const school = schoolFactory.buildWithId({ systems: [system], externalId: schoolExternalId });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const user = userFactory.buildWithId({ school, roles: [studentRoles], externalId: userExternalId });
				const account = accountFactory.buildWithId({
					userId: user.id,
					systemId: system.id,
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
				};
			};

			it('should return jwt', async () => {
				const { system } = await setup();

				const response: Response = await request(app.getHttpServer())
					.post(`${basePath}/oauth2`)
					.send({
						redirectUri: 'redirectUri',
						code: 'code',
						systemId: system.id,
					})
					.expect(HttpStatus.OK);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body.accessToken).toBeDefined();
			});
		});

		describe('when an error is provided', () => {
			const setup = async () => {
				const schoolExternalId = 'schoolExternalId';
				const userExternalId = 'userExternalId';

				const system = systemFactory.withOauthConfig().buildWithId({});
				const school = schoolFactory.buildWithId({ systems: [system], externalId: schoolExternalId });
				const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
				const user = userFactory.buildWithId({ school, roles: [studentRoles], externalId: userExternalId });
				const account = accountFactory.buildWithId({
					userId: user.id,
					systemId: system.id,
				});

				await em.persistAndFlush([system, school, studentRoles, user, account]);
				em.clear();

				return {
					system,
				};
			};

			it('should throw a InternalServerErrorException', async () => {
				const { system } = await setup();

				await request(app.getHttpServer())
					.post(`${basePath}/oauth2`)
					.send({
						redirectUri: 'redirectUri',
						error: SSOErrorCode.SSO_OAUTH_LOGIN_FAILED,
						systemId: system.id,
					})
					// TODO N21-820: change this to UNAUTHORIZED when refactoring exceptions
					.expect(HttpStatus.INTERNAL_SERVER_ERROR);
			});
		});
	});
});
