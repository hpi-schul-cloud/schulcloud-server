import { EntityManager } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, RoleName, School, System, User } from '@shared/domain';
import { KeycloakAdministrationService } from '@shared/infra/identity-management/keycloak-administration/service/keycloak-administration.service';
import { accountFactory, roleFactory, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { RequestBody } from '@src/modules/authentication/strategy/ldap.strategy';
import { OauthTokenResponse } from '@src/modules/oauth/service/dto';
import { ServerTestModule } from '@src/modules/server/server.module';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import crypto, { KeyPairKeyObjectResult } from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const schoolExternalId = 'mockSchoolExternalId';
const ldapAccountUserName = 'ldapAccountUserName';
const mockUserLdapDN = 'mockUserLdapDN';

const keyPair: KeyPairKeyObjectResult = crypto.generateKeyPairSync('rsa', { modulusLength: 4096 });
const publicRsaKey: string | Buffer = keyPair.publicKey.export({ type: 'pkcs1', format: 'pem' });
const privateRsaKey: string | Buffer = keyPair.privateKey.export({ type: 'pkcs1', format: 'pem' });

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
			getPublicKey: jest.fn().mockReturnValue(publicRsaKey),
			rsaPublicKey: publicRsaKey,
		}),
		getSigningKeys: jest.fn(),
	};
});

describe('Login Controller (api)', () => {
	const basePath = '/authentication';

	let app: INestApplication;
	let em: EntityManager;
	let kcAdminService: KeycloakAdministrationService;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		kcAdminService = app.get(KeycloakAdministrationService);
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
				const params = {
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
			system = systemFactory.withLdapConfig().buildWithId({});
			school = schoolFactory.buildWithId({ systems: [system], externalId: schoolExternalId });
			const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

			user = userFactory.buildWithId({ school, roles: [studentRoles], ldapDn: mockUserLdapDN });

			account = accountFactory.buildWithId({
				userId: user.id,
				username: `${schoolExternalId}/${ldapAccountUserName}`.toLowerCase(),
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
				const params: RequestBody = {
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
				const params = {
					username: 'nonExistentUser',
					password: 'wrongPassword',
				};
				await request(app.getHttpServer()).post(`${basePath}/ldap`).send(params).expect(401);
			});
		});
	});

	describe('loginOauth', () => {
		let account: Account;
		let user: User;
		let school: School;
		let system: System;

		const axiosMock: MockAdapter = new MockAdapter(axios);

		beforeAll(async () => {
			system = systemFactory.withOauthConfig().buildWithId({});
			school = schoolFactory.buildWithId({ systems: [system], externalId: schoolExternalId });
			const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });
			const username = `${schoolExternalId}/${ldapAccountUserName.trim().toLowerCase()}`;

			user = userFactory.buildWithId({ school, roles: [studentRoles], ldapDn: mockUserLdapDN, externalId: username });

			account = accountFactory.buildWithId({
				userId: user.id,
				username,
				systemId: system.id,
			});

			em.persist(system);
			em.persist(school);
			em.persist(studentRoles);
			em.persist(user);
			em.persist(account);
			await em.flush();

			const idToken: string = jwt.sign(
				{
					sub: username,
					iss: system.oauthConfig?.issuer,
					aud: system.oauthConfig?.clientId,
					iat: Date.now(),
					exp: Date.now() + 100000,
					external_sub: username,
				},
				{ key: privateRsaKey, passphrase: '0000' },
				{ algorithm: 'RS256' }
			);

			axiosMock.onPost(system.oauthConfig?.tokenEndpoint).reply<OauthTokenResponse>(200, {
				id_token: idToken,
				refresh_token: 'refreshToken',
				access_token: 'accessToken',
			});

			const wellKnown = kcAdminService.getWellKnownUrl();
			axiosMock.onGet(wellKnown).reply(200, {
				issuer: 'issuer',
				token_endpoint: 'tokenEndpoint',
				authorization_endpoint: 'authEndpoint',
				end_session_endpoint: 'logoutEndpoint',
				jwks_uri: 'jwksEndpoint',
			});
		});

		afterAll(() => {
			axiosMock.restore();
		});

		describe('when user login succeeds', () => {
			it('should sign and verify', () => {
				if (system?.oauthConfig) {
					const signed = jwt.sign(
						{},
						{ key: privateRsaKey, passphrase: '0000' },
						{ algorithm: 'RS256', audience: system.oauthConfig.clientId, issuer: system.oauthConfig.issuer }
					);
					jwt.verify(signed, publicRsaKey, {
						algorithms: ['RS256'],
						issuer: system.oauthConfig.issuer,
						audience: system.oauthConfig.clientId,
					});
				} else {
					fail();
				}
			});

			it('should return jwt', async () => {
				const params: OauthAuthorizationQueryParams = new OauthAuthorizationQueryParams();
				params.code = 'someCode';

				if (!system.oauthConfig) {
					fail('oauth system not properly initialized');
				}

				const response = await request(app.getHttpServer()).get(`${basePath}/oauth/${system.id}`).query(params).send();

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.status).toEqual(302);
			});
		});

		describe('when user login fails', () => {
			it('should return error response', async () => {
				const params: OauthAuthorizationQueryParams = new OauthAuthorizationQueryParams();
				params.error = 'someCode';

				if (!system.oauthConfig) {
					fail('oauth system not properly initialized');
				}

				const response = await request(app.getHttpServer()).get(`${basePath}/oauth/${system.id}`).query(params).send();

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.status).toEqual(302);
			});
		});
	});
});
