import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { MetricsModule } from '../metrics.module';

describe('Metrics Api Test', () => {
	let app: INestApplication;
	const baseRoute = 'metrics';

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [MetricsModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('getMetrics', () => {
		const setup = () => {
			const testApiClient = new TestApiClientBuilder(app, baseRoute).build();

			return { testApiClient };
		};
		it('returns ok 200', async () => {
			const { testApiClient } = setup();

			await testApiClient.get().expect(200);
		});
	});
});
