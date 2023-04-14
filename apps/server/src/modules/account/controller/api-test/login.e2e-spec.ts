import request from 'supertest';
import { EntityManager } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, RoleName, School, System, User } from '@shared/domain';
import { accountFactory, roleFactory, schoolFactory, systemFactory, userFactory } from '@shared/testing';
import { ServerTestModule } from '@src/modules/server/server.module';
import { LdapAuthorizationParams } from '../../../authentication/controllers/dto';

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

describe('Login Controller (e2e)', () => {
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
			it('should return jwt', async () => {
				const params: LdapAuthorizationParams = {
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
});
