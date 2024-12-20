import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ServerConfig } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VidisClientConfig } from './vidis-client-config';
import { VidisClientFactory } from './vidis-client-factory';

describe(VidisClientFactory.name, () => {
	let module: TestingModule;
	let factory: VidisClientFactory;
	let configService: DeepMocked<ConfigService<VidisClientConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				VidisClientFactory,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ServerConfig, true>>(),
				},
			],
		}).compile();

		factory = module.get(VidisClientFactory);
		configService = module.get(ConfigService);

		configService.getOrThrow.mockReturnValueOnce(faker.internet.url());
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
			const setup = () => {
				const username = faker.string.alpha();
				const password = faker.string.alpha();

				return {
					username,
					password,
				};
			};

			it('should return a vidis api client as an IDMBetreiberApiInterface', () => {
				const { username, password } = setup();

				const result = factory.createVidisClient({
					username,
					password,
				});

				expect(result).toBeDefined();
			});
		});
	});
});
