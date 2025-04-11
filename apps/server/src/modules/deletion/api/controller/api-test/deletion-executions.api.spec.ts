import { adminApiServerConfig } from '@modules/server/admin-api-server.config';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';

const baseRouteName = '/deletionExecutions';

describe(`deletionExecution (api)`, () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;
	const API_KEY = 'someotherkey';

	beforeAll(async () => {
		const config = adminApiServerConfig();
		config.ADMIN_API__ALLOWED_API_KEYS = [API_KEY];

		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('executeDeletions', () => {
		describe('when execute deletionRequests with default limit', () => {
			it('should return status 204', async () => {
				testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
				const response = await testApiClient.post('');

				expect(response.status).toEqual(204);
			}, 20000);
		});

		describe('without token', () => {
			it('should refuse with wrong token', async () => {
				testApiClient = new TestApiClient(app, baseRouteName, 'thisisaninvalidapikey', true);

				const response = await testApiClient.post('');

				expect(response.status).toEqual(401);
			});

			it('should refuse without token', async () => {
				testApiClient = new TestApiClient(app, baseRouteName, '', true);

				const response = await testApiClient.post('');

				expect(response.status).toEqual(401);
			});
		});
	});
});
