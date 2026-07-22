import { type OauthTokenResponse } from '@infra/oauth-adapter';
import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { type AccountEntity } from '@modules/account/repo';
import { accountFactory, defaultTestPassword } from '@modules/account/testing';
import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { type SystemEntity } from '@modules/system/repo';
import { systemEntityFactory } from '@modules/system/testing';
import { type User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import type { Server } from 'node:net';
import request, { type Response } from 'supertest';
import { type LdapAuthorizationBodyParams, type LocalAuthorizationBodyParams, type OauthLoginResponse } from '../dto';

const ldapAccountUserName = 'ldapAccountUserName';
const mockUserLdapDN = 'mockUserLdapDN';

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
			getPublicKey: jest.fn().mockReturnValue(JwtTestFactory.getPublicKey()),
			rsaPublicKey: JwtTestFactory.getPublicKey(),
		}),
		getSigningKeys: jest.fn(),
	};
});

describe('Login Controller (api)', () => {
	const basePath = '/authentication';

	let app: INestApplication<Server>;
	let em: EntityManager;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('loginLocal', () => {
		describe('when user login succeeds', () => {
			const setup = async () => {
				const user = userFactory.asStudent().buildWithId();
				const account = accountFactory.withUser(user).buildWithId();

				await em.persist([user, account]).flush();

				return { user };
			};

			it('should return jwt', async () => {
				const { user } = await setup();
				const params: LocalAuthorizationBodyParams = {
					username: user.email,
					password: defaultTestPassword,
				};
				const response = await request(app.getHttpServer()).post(`${basePath}/local`).send(params);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					accessToken: expect.any(String),
				});

				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
				const decodedToken = jwt.decode(response.body.accessToken);
				expect(decodedToken).toHaveProperty('userId');
				expect(decodedToken).toHaveProperty('accountId');
				expect(decodedToken).toHaveProperty('schoolId');
				expect(decodedToken).toHaveProperty('roles');
				expect(decodedToken).not.toHaveProperty('externalIdToken');
			});
		});

		describe('when user login fails', () => {
			const setup = async () => {
				const user = userFactory.asStudent().buildWithId();
				const account = accountFactory.withUser(user).buildWithId();

				await em.persist([user, account]).flush();

				return { account };
			};

			it('should return error response', async () => {
				const { account } = await setup();
				const params: LocalAuthorizationBodyParams = {
					username: account.username,
					password: 'wrongPassword',
				};

				const result = await request(app.getHttpServer()).post(`${basePath}/local`).send(params);

				expect(result.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user login fails cause account is deactivated', () => {
			const setup = async () => {
				const newUser = userFactory.asStudent().buildWithId();
				const deactivatedAccount = accountFactory.withUser(newUser).buildWithId({
					deactivatedAt: new Date(),
				});

				await em.persist([newUser, deactivatedAccount]).flush();

				return { deactivatedAccount };
			};

			it('should return error response', async () => {
				const { deactivatedAccount } = await setup();
				const params: LocalAuthorizationBodyParams = {
					username: deactivatedAccount.username,
					password: defaultTestPassword,
				};

				const result = await request(app.getHttpServer()).post(`${basePath}/local`).send(params);

				expect(result.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('loginLocalServiceAccount', () => {
		describe('when user login succeeds', () => {
			const setup = async () => {
				const user = userFactory.asServiceAccountUser([Permission.USER_CREATE]).buildWithId();
				const account = accountFactory.withUser(user).buildWithId();

				await em.persist([user, account]).flush();

				return { account };
			};

			it('should return jwt with isServiceAccount flag', async () => {
				const { account } = await setup();
				const params: LocalAuthorizationBodyParams = {
					username: account.username,
					password: defaultTestPassword,
				};
				const response = await request(app.getHttpServer()).post(`${basePath}/local-service-account`).send(params);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					accessToken: expect.any(String),
				});

				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
				const decodedToken = jwt.decode(response.body.accessToken);
				expect(decodedToken).toHaveProperty('userId');
				expect(decodedToken).toHaveProperty('accountId');
				expect(decodedToken).toHaveProperty('schoolId');
				expect(decodedToken).toHaveProperty('roles');
				expect(decodedToken).toHaveProperty('isServiceAccount', true);
				expect(decodedToken).not.toHaveProperty('externalIdToken');
			});
		});

		describe('when user login fails', () => {
			const setup = async () => {
				const user = userFactory.asServiceAccountUser([Permission.USER_CREATE]).buildWithId();
				const account = accountFactory.withUser(user).buildWithId();

				await em.persist([user, account]).flush();

				return { account };
			};

			it('should return error response', async () => {
				const { account } = await setup();
				const params: LocalAuthorizationBodyParams = {
					username: account.username,
					password: 'wrongPassword',
				};

				const result = await request(app.getHttpServer()).post(`${basePath}/local-service-account`).send(params);

				expect(result.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user login fails cause account is deactivated', () => {
			const setup = async () => {
				const newUser = userFactory.asServiceAccountUser([Permission.USER_CREATE]).buildWithId();
				const deactivatedAccount = accountFactory.withUser(newUser).buildWithId({
					deactivatedAt: new Date(),
				});

				await em.persist([newUser, deactivatedAccount]).flush();

				return { deactivatedAccount };
			};

			it('should return error response', async () => {
				const { deactivatedAccount } = await setup();
				const params: LocalAuthorizationBodyParams = {
					username: deactivatedAccount.username,
					password: defaultTestPassword,
				};

				const result = await request(app.getHttpServer()).post(`${basePath}/local-service-account`).send(params);

				expect(result.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is not a service account', () => {
			const setup = async () => {
				const user = userFactory.asStudent().buildWithId();
				const account = accountFactory.withUser(user).buildWithId();

				await em.persist([user, account]).flush();

				return { account };
			};

			it('should return unauthorized error', async () => {
				const { account } = await setup();
				const params: LocalAuthorizationBodyParams = {
					username: account.username,
					password: defaultTestPassword,
				};

				const result = await request(app.getHttpServer()).post(`${basePath}/local-service-account`).send(params);

				expect(result.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('loginLdap', () => {
		describe('when user login succeeds', () => {
			const setup = async () => {
				const schoolExternalId = 'mockSchoolExternalId';
				const system: SystemEntity = systemEntityFactory.withLdapConfig().buildWithId({});
				const school = schoolEntityFactory.buildWithId({
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

				await em.persist([system, school, studentRoles, user, account]).flush();

				const params: LdapAuthorizationBodyParams = {
					username: ldapAccountUserName,
					password: defaultTestPassword,
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

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				const token = response.body.accessToken;
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const decodedToken = jwt.decode(token);
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
				const school = schoolEntityFactory.buildWithId({
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

				await em.persist([system, school, studentRoles, user, account]).flush();

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
				const school = schoolEntityFactory.buildWithId({
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

				await em.persist([system, school, studentRoles, user, account]).flush();

				const params: LdapAuthorizationBodyParams = {
					username: ldapAccountUserName,
					password: defaultTestPassword,
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
				const school = schoolEntityFactory.buildWithId({
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

				await em.persist([system, school, studentRole, user, account]).flush();

				const params: LdapAuthorizationBodyParams = {
					username: ldapAccountUserName,
					password: defaultTestPassword,
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
				expect(decodedToken).toMatchObject({
					userId: user.id,
					systemId: system.id,
					roles: [studentRole.id],
					schoolId: school.id,
					accountId: account.id,
					isExternalUser: true,
				});
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

				await em.persist([system, school, studentRoles, user, account]).flush();
				em.clear();

				const idToken: string = JwtTestFactory.createJwt({
					iss: system.oauthConfig?.issuer,
					aud: system.oauthConfig?.clientId,
					// For OIDC provisioning strategy
					external_sub: userExternalId,
				});

				const axiosMock: MockAdapter = new MockAdapter(axios);

				axiosMock.onPost(system.oauthConfig?.tokenEndpoint).reply<OauthTokenResponse>(200, {
					id_token: idToken,
					refresh_token: JwtTestFactory.createJwt(),
					access_token: JwtTestFactory.createJwt(),
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

				await em.persist([system, school, teacherRoles, user, account]).flush();

				const idToken: string = JwtTestFactory.createJwt({
					iss: system.oauthConfig?.issuer,
					aud: system.oauthConfig?.clientId,
					// For OIDC provisioning strategy
					external_sub: userExternalId,
				});

				const axiosMock: MockAdapter = new MockAdapter(axios);

				axiosMock.onPost(system.oauthConfig?.tokenEndpoint).reply<OauthTokenResponse>(200, {
					id_token: idToken,
					refresh_token: JwtTestFactory.createJwt(),
					access_token: JwtTestFactory.createJwt(),
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

	describe('extendSession', () => {
		describe('when a valid access token is provided', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persist([studentAccount, studentUser]).flush();
				em.clear();

				const loggedInClient = await new TestApiClientBuilder(app, basePath).build(studentAccount);

				return {
					loggedInClient,
					studentAccount,
				};
			};

			it('should return new ttl', async () => {
				const { loggedInClient } = await setup();

				const response: Response = await loggedInClient.post('/refresh-session');

				expect(response.body).toEqual({
					expiresInSeconds: expect.any(Number),
				});
			});
		});

		describe('when an invalid access token is provided', () => {
			it('should return error response', async () => {
				const response: Response = await new TestApiClientBuilder(app, basePath).build().post('/refresh-session');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});

	describe('supportJwt', () => {
		describe('when unprivileged user wants to access', () => {
			const setup = async () => {
				const { superheroAccount, superheroUser } = UserAndAccountTestFactory.buildSuperhero();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([superheroAccount, superheroUser, studentAccount, studentUser]).flush();
				em.clear();

				const data = { userId: superheroUser.id };
				const loggedInClient = await new TestApiClientBuilder(app, basePath).build(studentAccount);

				return { data, loggedInClient };
			};

			describe('when jwt is not passed', () => {
				it('should respond with unauthorized exception', async () => {
					const { data } = await setup();

					const response = await new TestApiClientBuilder(app, basePath).build().post('/support-jwt', data);

					expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				});
			});

			describe('when user has not the privilege to request supportJwt', () => {
				it('should respond with forbidden exception', async () => {
					const { data, loggedInClient } = await setup();

					const response = await loggedInClient.post('/support-jwt', data);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
				});
			});
		});

		describe('when privileged user wants to access', () => {
			const setup = async (userId?: string) => {
				const { superheroAccount, superheroUser } = UserAndAccountTestFactory.buildSuperhero();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([superheroAccount, superheroUser, studentAccount, studentUser]).flush();
				em.clear();

				const data = { userId: userId ?? studentUser.id };
				const loggedInClient = await new TestApiClientBuilder(app, basePath).asServiceAccount().build(superheroAccount);

				return { data, loggedInClient };
			};

			describe('when requested user exists', () => {
				it('should respond with loginResponse', async () => {
					const { data, loggedInClient } = await setup();

					const response = await loggedInClient.post('/support-jwt', data);

					expect(response.statusCode).toEqual(HttpStatus.CREATED);
					expect(response.body).toMatchObject({
						accessToken: expect.any(String),
					});
				});
			});

			describe('when requested user does not exist', () => {
				it('should return 404', async () => {
					const notExistedUserId = new ObjectId().toString();
					const { loggedInClient } = await setup(notExistedUserId);

					const response = await loggedInClient.post('/support-jwt', { userId: notExistedUserId });

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
				});
			});

			describe('when invalid data passed', () => {
				it('should return 400', async () => {
					const invalidUserId = 'someId';
					const { loggedInClient } = await setup(invalidUserId);

					const response = await loggedInClient.post('/support-jwt', { userId: invalidUserId });

					expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				});
			});
		});
	});
});
