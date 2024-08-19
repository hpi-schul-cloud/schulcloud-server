import { ApiKeyGuard } from '@infra/auth-guard';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@shared/testing';

const baseRouteName = '/deletionExecutions';

describe(`deletionExecution (api)`, () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;
	const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		})
			.overrideGuard(ApiKeyGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					return req.headers['x-api-key'] === API_KEY;
				},
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('executeDeletions', () => {
		describe('when execute deletionRequests with default limit', () => {
			it('should return status 204', async () => {
				const response = await testApiClient.post('');
				expect(response.status).toEqual(204);
			}, 20000);
		});

		describe('without token', () => {
			it('should refuse with wrong token', async () => {
				const client = new TestApiClient(app, baseRouteName, 'thisisaninvalidapikey', true);
				const response = await client.post('');
				expect(response.status).toEqual(403);
			});
			it('should refuse without token', async () => {
				const client = new TestApiClient(app, baseRouteName, '', true);
				const response = await client.post('');
				expect(response.status).toEqual(403);
			});
		});
	});
});
