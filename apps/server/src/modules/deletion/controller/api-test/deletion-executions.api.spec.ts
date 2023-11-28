import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { TestXApiKeyClient } from '@shared/testing';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.module';

const baseRouteName = '/deletionExecutions';

describe(`deletionExecution (api)`, () => {
	let app: INestApplication;
	let testXApiKeyClient: TestXApiKeyClient;
	const API_KEY = '1ab2c3d4e5f61ab2c3d4e5f6';

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
		testXApiKeyClient = new TestXApiKeyClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('executeDeletions', () => {
		describe('when execute deletionRequests with default limit', () => {
			it('should return status 204', async () => {
				const response = await testXApiKeyClient.post('');

				expect(response.status).toEqual(204);
			});
		});
	});
});
