import { createMock } from '@golevelup/ts-jest';
import { ServerTestModule } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TspClientFactory } from './tsp-client-factory';
import { TspClientModule } from './tsp-client.module';

// NOTE: This test is skipped because it requires a valid client id, secret and token endpoint.
//       It is meant to be used for manual testing only.
// This test expects that configService.getOrThrow is only used for the specified keys. This is not a reasonable expectation.
// In fact getOrThrow is used now at another place and the test is broken.
describe.skip('TspClientFactory Integration', () => {
	let module: TestingModule;
	let sut: TspClientFactory;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ServerTestModule, TspClientModule],
		})
			.overrideProvider(ConfigService)
			.useValue(
				createMock<ConfigService>({
					getOrThrow: (key: string) => {
						switch (key) {
							case 'TSP_API_CLIENT_BASE_URL':
								return 'https://test.schulportal-thueringen.de/tip-ms/api';
							case 'TSP_API_CLIENT_TOKEN_LIFETIME_MS':
								return 30_000;
							default:
								throw new Error(`Unknown key: ${key}`);
						}
					},
				})
			)
			.compile();

		sut = module.get(TspClientFactory);
	});

	afterAll(async () => {
		await module.close();
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
