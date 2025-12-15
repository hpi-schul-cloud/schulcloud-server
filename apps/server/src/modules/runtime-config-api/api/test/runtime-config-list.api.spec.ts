import { RuntimeConfigDefault } from '@infra/runtime-config';
import { RuntimeConfigModule } from '@infra/runtime-config/runtime-config.module';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerRuntimeConfigModule } from '@modules/runtime-config-api/server-runtime-config.module';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';

describe('RuntimeConfig Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	const defaults: RuntimeConfigDefault[] = [
		{ key: 'TEST_STRING', type: 'string', value: 'a string' },
		{ key: 'TEST_NUMBER', type: 'number', value: 42 },
		{ key: 'TEST_BOOLEAN', type: 'boolean', value: true },
	];

	@Module({
		imports: [
			RuntimeConfigModule.forRoot({
				defaults,
			}),
		],
		exports: [RuntimeConfigModule],
	})
	class ServerRuntimeConfigModuleOverride {}

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideModule(ServerRuntimeConfigModule)
			.useModule(ServerRuntimeConfigModuleOverride)
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'runtime-config');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('GET /runtime-config', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const response = await testApiClient.get('');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in as teacher', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();
				const loggedInClient = await testApiClient.login(teacherAccount);
				return { loggedInClient };
			};

			it('should return 200', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('');

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});

		describe('when user is logged in as student', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();
				const loggedInClient = await testApiClient.login(studentAccount);
				return { loggedInClient };
			};

			it('should return 200', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('');

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});
	});
});
