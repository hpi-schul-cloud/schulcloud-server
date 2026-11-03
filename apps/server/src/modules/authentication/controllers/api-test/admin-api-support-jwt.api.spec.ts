import { ConfigurationModule } from '@infra/configuration';
import { JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { schoolEntityFactory } from '@modules/school/testing';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { cleanupCollections } from '@testing/cleanup-collections';
import { JwtAuthenticationFactory } from '@testing/factory/jwt-authentication.factory';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import supertest from 'supertest';
import type { Server } from 'node:net';

jest.setTimeout(60_000);

describe('Admin API - Support JWT', () => {
	const basePath = '/admin/authentication';
	let app: INestApplication<Server>;
	let em: EntityManager;
	let jwtConfig: TestJwtModuleConfig;

	const postAs = async (
		user: ReturnType<typeof UserAndAccountTestFactory.buildStudent>['studentUser'],
		account: ReturnType<typeof UserAndAccountTestFactory.buildStudent>['studentAccount'],
		body: { userId: string; supportUserId?: string }
	) => {
		const token = JwtAuthenticationFactory.createJwt(
			{
				accountId: account.id,
				userId: user.id,
				schoolId: user.school.id,
				roles: user.roles.getItems().map((role) => role.id),
				isServiceAccount: false,
				support: false,
				isExternalUser: false,
			},
			jwtConfig
		);
		await app.get(JwtWhitelistAdapter).addToWhitelist(account.id, 'jti');

		return supertest(app.getHttpServer())
			.post(`${basePath}/support-jwt`)
			.set('X-API-KEY', 'someotherkey')
			.set('Authorization', `Bearer ${token}`)
			.send(body);
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await app.close();
	});

	it('requires the Admin API key', async () => {
		const response = await new TestApiClientBuilder(app, basePath)
			.withApiKey('thisisaninvalidapikey')
			.build()
			.post('/support-jwt', { userId: '000000000000000000000000' });
		expect(response.status).toBe(401);
	});

	it('requires a verified user JWT in addition to the Admin API key', async () => {
		const response = await new TestApiClientBuilder(app, basePath)
			.withApiKey('someotherkey')
			.build()
			.post('/support-jwt', { userId: '000000000000000000000000' });
		expect(response.status).toBe(401);
	});

	it('creates a support JWT after checking the identified support user permissions', async () => {
		const school = schoolEntityFactory.buildWithId();
		const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({ school }, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
		]);
		const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent({ school });
		await em.persist([school, superheroUser, superheroAccount, studentUser, studentAccount]).flush();

		const response = await postAs(superheroUser, superheroAccount, { userId: studentUser.id });

		expect(response.status).toBe(201);
		expect(response.body).toEqual(expect.objectContaining({ accessToken: expect.any(String) }));
	});

	it('rejects an identified support user without the required permissions', async () => {
		const school = schoolEntityFactory.buildWithId();
		const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({ school }, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
		]);
		const { studentUser: supportUser, studentAccount: supportAccount } = UserAndAccountTestFactory.buildStudent({
			school,
		});
		const { studentUser: targetUser, studentAccount: targetAccount } = UserAndAccountTestFactory.buildStudent({
			school,
		});
		await em
			.persist([school, superheroUser, superheroAccount, supportUser, supportAccount, targetUser, targetAccount])
			.flush();

		const response = await postAs(supportUser, supportAccount, {
			userId: targetUser.id,
			supportUserId: superheroUser.id,
		});

		expect(response.status).toBe(403);
	});

	it('returns 404 when the target user does not exist', async () => {
		const school = schoolEntityFactory.buildWithId();
		const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({ school }, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
		]);
		await em.persist([school, superheroUser, superheroAccount]).flush();

		const response = await postAs(superheroUser, superheroAccount, { userId: new ObjectId().toHexString() });

		expect(response.status).toBe(404);
	});

	it('returns 400 when the target user ID is invalid', async () => {
		const school = schoolEntityFactory.buildWithId();
		const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero({ school }, [
			Permission.CAN_EXECUTE_INSTANCE_OPERATIONS,
		]);
		await em.persist([school, superheroUser, superheroAccount]).flush();

		const response = await postAs(superheroUser, superheroAccount, { userId: 'someId' });

		expect(response.status).toBe(400);
	});
});
