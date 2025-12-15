import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { RuntimeConfigDefault } from '../../domain/runtime-config-value.do';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { RuntimeConfigModule } from '@infra/runtime-config/runtime-config.module';
import { ServerRuntimeConfigModule } from '@infra/runtime-config/server-runtime-config.module';
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

	// Test suite for updating runtime config (to be implemented)
	describe('RuntimeConfig Update API', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const response = await testApiClient.patch('/TEST_STRING', { value: 'new value' });

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

			it('should return 401', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.patch('/TEST_STRING', { value: 'new value' });

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when user is logged in as superhero', () => {
			const setup = async () => {
				const { superheroAccount, superheroUser } = UserAndAccountTestFactory.buildSuperhero();
				await em.persistAndFlush([superheroAccount, superheroUser]);
				em.clear();
				const loggedInClient = await testApiClient.login(superheroAccount);
				return { loggedInClient };
			};

			it('should return 200 for string', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.patch('/TEST_STRING', { value: 'new value' });

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should return 200 for number', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.patch('/TEST_NUMBER', { value: '43' });

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should return 200 for boolean', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.patch('/TEST_BOOLEAN', { value: 'false' });

				expect(response.status).toEqual(HttpStatus.OK);
			});

			it('should should actually update the value', async () => {
				const { loggedInClient } = await setup();

				await loggedInClient.patch('/TEST_STRING', { value: 'new value' });

				const updated = await loggedInClient.get('');

				expect(updated.status).toEqual(HttpStatus.OK);
				expect(updated.body).toEqual({
					data: expect.arrayContaining([
						expect.objectContaining({
							key: 'TEST_STRING',
							value: 'new value',
						}),
					]) as RuntimeConfigListResponse,
				});
			});

			it('should return 400 for invalid value type', async () => {
				const { loggedInClient } = await setup();
				const response = await loggedInClient.patch('/TEST_NUMBER', { value: 'invalid number' });

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
			});
		});
	});
});
