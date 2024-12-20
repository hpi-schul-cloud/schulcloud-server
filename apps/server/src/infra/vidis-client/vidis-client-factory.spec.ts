import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ServerConfig } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VidisClientFactory } from './vidis-client-factory';

describe('TspClientFactory', () => {
	let module: TestingModule;
	let sut: VidisClientFactory;
	let configServiceMock: DeepMocked<ConfigService<ServerConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisClientFactory,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ServerConfig, true>>({
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

		sut = module.get(VidisClientFactory);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('createExportClient', () => {
		describe('when createExportClient is called', () => {
			it('should return ExportApiInterface', () => {
				const result = sut.createExportClient({
					password: faker.string.alpha(),
					username: faker.string.alpha(),
				});

				expect(result).toBeDefined();
				expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(0);
			});
		});
	});
});
