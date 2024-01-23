import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, TestXApiKeyClient } from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';

const baseRouteName = '/admin/schools';

describe('Admin API - Schools (API)', () => {
	let app: INestApplication;
	let testXApiKeyClient: TestXApiKeyClient;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			/* .overrideGuard(AuthGuard('api-key'))
			.useValue(
				new XApiKeyStrategy(
					new ConfigService(() => {
						return {
							ADMIN_API__ALLOWED_API_KEYS: ['dsfsdfl5sdhflkjsdfsdfs'],
						};
					})
				)
			) */
			.compile();

		app = module.createNestApplication();
		await app.init();
		testXApiKeyClient = new TestXApiKeyClient(app, baseRouteName);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('create a school', () => {
		describe('without token', () => {
			it('should refuse with wrong token', async () => {
				const client = new TestXApiKeyClient(app, baseRouteName, 'thisisaninvalidapikey');
				const response = await client.post('');
				expect(response.status).toEqual(401);
			});
			it('should refuse without token', async () => {
				const response = await testApiClient.post('');
				expect(response.status).toEqual(401);
			});
		});

		describe('with api token', () => {
			it('should return school', async () => {
				const response = await testXApiKeyClient.post('');
				expect(response.status).toEqual(204);
				// expect(response.body).toBeInstanceOf(School)
			});

			it.todo('should have persisted the school');
		});
	});
});
