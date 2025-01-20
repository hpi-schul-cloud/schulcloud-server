import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VidisClientConfig } from './vidis-client-config';
import { VidisClientFactory } from './vidis-client-factory';

describe(VidisClientFactory.name, () => {
	let module: TestingModule;
	let factory: VidisClientFactory;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisClientFactory,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<VidisClientConfig, true>>({
						getOrThrow: (key: string) => {
							switch (key) {
								case 'VIDIS_API_CLIENT_BASE_URL':
									return faker.internet.url();
								default:
									throw new Error(`Unknown key: ${key}`);
							}
						},
					}),
				},
			],
		}).compile();

		factory = module.get(VidisClientFactory);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(factory).toBeDefined();
	});

	describe('createVidisClient', () => {
		describe('when the function is called', () => {
			it('should return a vidis api client as an IDMBetreiberApiInterface', () => {
				const result = factory.createVidisClient();

				expect(result).toBeDefined();
			});
		});
	});
});
