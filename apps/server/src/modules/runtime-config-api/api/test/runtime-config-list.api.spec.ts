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
import { RuntimeConfigListResponse } from '../dto/response/runtime-config-list.response';

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
				await em.persist([teacherAccount, teacherUser]).flush();
				em.clear();
				const loggedInClient = await testApiClient.login(teacherAccount);
				return { loggedInClient };
			};

			it('should return 200', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('');

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should have some data', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get('');

				const body = response.body as RuntimeConfigListResponse;
				expect(body.data).toEqual(
					expect.arrayContaining([
						expect.objectContaining({ key: 'TEST_STRING' }),
						expect.objectContaining({ key: 'TEST_NUMBER' }),
						expect.objectContaining({ key: 'TEST_BOOLEAN' }),
					])
				);
			});
		});

		describe('when user is logged in as student', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persist([studentAccount, studentUser]).flush();
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
