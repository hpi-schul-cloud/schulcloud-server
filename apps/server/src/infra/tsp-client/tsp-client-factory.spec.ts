import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ServerConfig } from '@src/modules/server';
import { TspClientFactory } from './tsp-client-factory';

describe('TspClientFactory', () => {
	let module: TestingModule;
	let sut: TspClientFactory;
	let configServiceMock: DeepMocked<ConfigService<ServerConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspClientFactory,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ServerConfig, true>>({
						getOrThrow: (key: string) => {
							switch (key) {
								case 'TSP_API_TOKEN_LIFETIME_MS':
									return faker.number.int();
								default:
									return faker.lorem.word();
							}
						},
					}),
				},
			],
		}).compile();

		sut = module.get(TspClientFactory);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('createExportClient', () => {
		describe('when called', () => {
			it('should return ExportApiInterface', () => {
				const result = sut.createExportClient();

				expect(result).toBeDefined();
				expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(0);
			});
		});
	});

	describe('when using the created client', () => {
		const setup = () => {
			const client = sut.createExportClient();
			return client;
		};

		it('should return the migration version', async () => {
			const client = setup();

			const result = await client.exportLehrerListMigration();

			expect(result).toBeDefined();
		});
	});
});
