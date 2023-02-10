import { EntityManager } from '@mikro-orm/core';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, RoleName, School, System, User } from '@shared/domain';
import { accountFactory, roleFactory, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { RequestBody } from '@src/modules/authentication/strategy/ldap.strategy';
import { OauthAdapterService } from '@src/modules/oauth/service/oauth-adapter.service';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto';
import { ServerTestModule } from '@src/modules/server/server.module';
import request from 'supertest';
import { AuthorizationParams } from '../authorization.params';

const schoolExternalId = 'mockSchoolExternalId';
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

const oauthAdapterServiceMock: DeepMocked<OauthAdapterService> = createMock<OauthAdapterService>();

describe('Login Controller (api)', () => {
	const basePath = '/authentication';

	let app: INestApplication;
	let em: EntityManager;

	const defaultPassword = 'DummyPasswd!1';
	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(OauthAdapterService)
			.useValue(oauthAdapterServiceMock)
			.compile();

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
				const params = {
					username: user.email,
					password: defaultPassword,
				};
				const response = await request(app.getHttpServer()).post(`${basePath}/local`).send(params).expect(200);

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body.accessToken).toBeDefined();
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

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body.accessToken).toBeDefined();
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

		const privateRsaKey = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: AES-256-CBC,39910E13D7A314ED523436FC5B91315D

L1TqC+DIF6s39aDWf77TRfHzjhTjGEYMglKx8ZTHKhLeflc2X1gPy4cpxa8Saonm
G9pyadU7dMYXmhmVtdf5+OPTQ0SUOuuIvH/wMYvGWFfb0AuXZo8iBWZIrzMMBmdq
l+hOPHhP8ZnPD05TrQ6NQByEg9nITdPX8OWILo7WDFnUVegI4OfweJ+59Tj6zXb1
aqcUbGmX1Q6VsAZFsJIMqX3bYVxgviCrofwB9ZMTTeITgybHcoYmu9o6ndx9XkwA
yhntoiKsZ/t8QxFndxIU5oUnwFhKLU3lYCym+scgSPCuhmW5PCgmcNAfjMNnVZTj
PU86bhDhFF/nWClD6s6T1w69lYDLSgIWEiNe3VknOanU/baV+KPQBMYqX6IImPuC
EpmyfqRdzNOIzivjDBzHlyb3x3jR7ltmV0z7dfupY965wfFxqi4D3X62/4BMxu0M
3qwY6uTTsObJekjRT9YCWTOd3ynqLi0Gg7AAzXeGkqfsxb9/OOtMNjAz402rNCpg
bPkTlkKfozYtZfflcKnHBoW535WmwCBm83wPN+20gnWy9gQlWSc+BZu2US13/wfv
Bp77EHVk3yL3IctBawqB+YKdWlTIipBFgcwOyRhdTsILrWsOeeoK2ZYdQbGanwoM
d5UdTNn6VT4uPdTvXyVRIeeK+lopvyoTRCQyyTjTsImbD0pp/BDMh5cdoLzvcWLo
TJL/dESig/93OQmvcf5GGPfYKmwwlcUs82iK1G0O/Ur8h+10mx7K/ZLql00rO+NK
VW/ierAI4ZBIKfu+7Eh8ioWT4AMInRye9IumAwOLbDyigZ/wyhPoffesn8S2Wk75
pN6gODA3um0Ws+o1aLwA7GdqKG8ThWS3esIgH9vrjfb+MozbMqNUxSj28ItZ9w2K
w2Z0nbgAWZjYf4/uBqeCHzl3PQBCdrDLIEp2A8oWUEMc0ZKMvhHa7OFv/a4X2JFj
nFQ/GxbQlH1A8NZK+oFLJbOB8vwP/p4P5xtzN+kRpP9H84dqtR5L4zP1eUBc1+nY
MpsirAZkmEvqt2dKYM+AmhsNHTm6IE7J4hfds6NfFZ8rnIUSRm8JQJlQoZaU3Wra
pj/7yqnnmpKDWjOdC1EM/niTjAs0xuZJtmoEcbCbaRIS+6Kbga5aI/O8ftxTz7YA
eL9oV9CQJZyLJODcRSK54q0PSt6TP6c8lt6YMnH/I4cnuu7K62/usJ3VhX7LhUVy
+EIlA2Wj1KUyDqk0LjMh1KPM5WYroVqvRvrtKW4AbLYfAmCwDkTF4TmS9PF0+9Eq
C6WnPmlEN8XAaQ9ZMJLaa/8MMdHSlK6wE/h5XEXIIfpwGFwOnVICvfpVGDMJ+YK3
mt3C04B8LYqBlIeHft5Rkm8vRgySeMdiFrDQVrXVUVviVDBa0H03SRe3XHRveNgt
DRP1tRsF8Teu3NXNA1LeAUijar9BabEjhlqMl4Vq3JMljxaUORhaM5cTvRHx6Up0
R/8oddAwMIh2OaF2gEKoq82RLokCHJoX7DzoZ1tBZKP3qRwb1YzD7+zdK82lqzwG
Ci2Q/MNdQptCJm76mx6zmJ5wXWaUhQmjUKuvJMhKPAmfDtW4YkFDH8nQnxFAw77M
-----END RSA PRIVATE KEY-----`.replace(/\\n/g, '\n');

		const publicRsaKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzks9cMQgU0X9SbhNcgzc
qYOvL500UzEDOU5/lI3haiq+bpmkfp4OOpdu2xEavPzHp65RahFI07sRsbnm1bpT
wPpi44H96NnZR5LnSUJz4v4Lm/ehkCgMy48JDUvIiA3otLxCAhRBZ6g6rCO9/osK
LGKCrknf6B5Ianyi0LOeNHfuaAqXTmeSvG8bs6qdS54BPNSHMLnk5k/0t2KQpDcI
dsFau1pS1y6v7kthpX0ksh4+0k8hrqWtZwCLBlukWEQ6CBaPq7iizK4u2sSQUDPB
hV3nfnA7fVswvTWFfdAVMJDEbhpOfPWsnJmkYwYExldqpTo6PhtsvC1/bHbNxSBt
jwIDAQAB
-----END PUBLIC KEY-----`.replace(/\\n/g, '\n');

		beforeAll(async () => {
			system = systemFactory.withOauthConfig().buildWithId({});
			school = schoolFactory.buildWithId({ systems: [system], externalId: schoolExternalId });
			const studentRoles = roleFactory.build({ name: RoleName.STUDENT, permissions: [] });

			user = userFactory.buildWithId({ school, roles: [studentRoles], ldapDn: mockUserLdapDN });

			account = accountFactory.buildWithId({
				userId: user.id,
				username: `${schoolExternalId}/${ldapAccountUserName.trim().toLowerCase()}`,
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
			it('should return jwt', () => {
				const signed = jwt.sign('dummyAccessToken', { key: privateRsaKey, passphrase: '0000' }, { algorithm: 'RS256' });
				jwt.verify(signed, publicRsaKey, {
					algorithms: ['RS256'],
					// issuer: oauthConfig.issuer,
					// audience: oauthConfig.clientId,
				});
			});

			it('should return jwt', async () => {
				const params: AuthorizationParams = {
					code: 'someCode',
				};
				const tokenResponse: OauthTokenResponse = {
					access_token: jwt.sign(
						'dummyAccessToken',
						{ key: privateRsaKey, passphrase: '0000' },
						{ algorithm: 'RS256' }
					),
					refresh_token: jwt.sign(
						'dummyRefreshToken',
						{ key: privateRsaKey, passphrase: '0000' },
						{ algorithm: 'RS256' }
					),
					id_token: jwt.sign('dummyIdToken', { key: privateRsaKey, passphrase: '0000' }, { algorithm: 'RS256' }),
				};
				oauthAdapterServiceMock.getPublicKey.mockResolvedValueOnce(publicRsaKey);
				oauthAdapterServiceMock.sendTokenRequest.mockResolvedValueOnce(tokenResponse);

				const response = await request(app.getHttpServer()).get(`${basePath}/oauth/${system.id}`).query(params).send();

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(response.body.accessToken).toBeDefined();
			});
		});

		describe('when user login fails', () => {
			it('should return error response', async () => {
				const params = {
					username: 'nonExistentUser',
					password: 'wrongPassword',
				};
				await request(app.getHttpServer()).get(`${basePath}/oauth/${system.id}`).send(params).expect(401);
			});
		});
	});
});
