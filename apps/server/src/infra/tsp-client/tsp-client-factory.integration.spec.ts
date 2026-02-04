import { ServerTestModule } from '@modules/server';
import { Test, TestingModule } from '@nestjs/testing';
import { TspClientFactory } from './tsp-client-factory';
import { TSP_CLIENT_CONFIG_TOKEN } from './tsp-client.config';
import { TspClientModule } from './tsp-client.module';

// NOTE: This test is skipped because it requires a valid client id, secret and token endpoint.
//       It is meant to be used for manual testing only.
describe.skip('TspClientFactory Integration', () => {
	let module: TestingModule;
	let sut: TspClientFactory;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ServerTestModule, TspClientModule],
		})
			.overrideProvider(TSP_CLIENT_CONFIG_TOKEN)
			.useValue({
				baseUrl: 'https://test.schulportal-thueringen.de/tip-ms/api',
				tokenLifetimeMs: 30000,
			})
			.compile();

		sut = module.get(TspClientFactory);
	});

	afterAll(async () => {
		if (module) {
			await module.close();
		}
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe.skip('when requesting the version', () => {
		const setup = () => {
			// The client id, secret and token endpoint can be found in 1Password,
			// search for "test2 test"
			const api = sut.createExportClient({
				clientId: '<insert client id here>',
				clientSecret: '<insert client secret here>',
				tokenEndpoint: '<insert token endpoint here>',
			});

			return { api };
		};

		it(
			'should return the version',
			async () => {
				const { api } = setup();

				const result = await api.version();

				expect(result.status).toEqual(200);
				expect(result.data.version).toEqual('1.1');
			},
			10 * 1000
		);
	});
});
