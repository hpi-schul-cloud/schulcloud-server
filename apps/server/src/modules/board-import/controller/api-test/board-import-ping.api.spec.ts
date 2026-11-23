import { ConfigurationModule } from '@infra/configuration';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig } from '@testing/test-jwt-module.config';
import { BoardImportApiTestModule } from '../../board-import-api.app.module';
import { BoardImportPingResponse } from '../dto';

const baseRouteName = 'board-import';

describe('Board Import Controller (API)', () => {
	let app: INestApplication;
	let jwtConfig: TestJwtModuleConfig;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [BoardImportApiTestModule, ConfigurationModule.register(TEST_JWT_CONFIG_TOKEN, TestJwtModuleConfig)],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		jwtConfig = module.get(TEST_JWT_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('ping', () => {
		describe('when the user is not authenticated', () => {
			it('should return status 401', async () => {
				const response = await new TestApiClientBuilder(app, baseRouteName).build().get('ping');

				expect(response.status).toEqual(401);
			});
		});

		describe('when the user is authenticated', () => {
			const setup = async () => {
				const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();
				const loggedInClient = await new TestApiClientBuilder(app, baseRouteName)
					.withJwt(studentUser, jwtConfig)
					.build(studentAccount);
				const expectedResponse = new BoardImportPingResponse('pong');

				return { loggedInClient, expectedResponse };
			};

			it('should return status 200 with the fixed answer', async () => {
				const { loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get('ping');

				expect(response.status).toEqual(200);
				expect(response.body).toEqual(expectedResponse);
			});
		});
	});
});
