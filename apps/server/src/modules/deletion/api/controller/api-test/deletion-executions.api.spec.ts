import { AdminApiServerTestModule } from '@modules/server/admin-api.server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
			.overrideGuard(AuthGuard('api-key'))
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.headers['X-API-KEY'] = API_KEY;
					return true;
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
			});
		});
	});
});
