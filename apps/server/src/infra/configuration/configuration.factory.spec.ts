import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StringToBoolean } from '@shared/transformer';
import { IsBoolean, IsString } from 'class-validator';
import { ConfigProperty, Configuration } from './configuration.decorator';
import { ConfigurationFactory } from './configuration.factory';

@Configuration()
class TestConfig {
	@IsString()
	@ConfigProperty('TEST_VALUE_1')
	public TEST_VALUE!: string;

	@IsString()
	@ConfigProperty('TEST_VALUE2')
	public testValue2!: string;

	@IsString()
	@ConfigProperty()
	public testValueWithD!: string;

	@IsBoolean()
	@StringToBoolean()
	public testValueWithOutD!: boolean;

	@IsBoolean()
	public testValueWithOutD1 = true;
}

describe(ConfigurationFactory.name, () => {
	let module: TestingModule;
	let configFactory: ConfigurationFactory;
	let configService: DeepMocked<ConfigService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		configService = module.get(ConfigService);
		configFactory = new ConfigurationFactory(configService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getAllValidConfigsByType', () => {
		describe('when value is valid', () => {
			it('should return valid configs', () => {
				jest.spyOn(configService, 'get').mockImplementation((key: string) => {
					if (key === 'TEST_VALUE_1') {
						return 'test';
					}
					if (key === 'TEST_VALUE2') {
						return 'test2';
					}
					if (key === 'testValueWithD') {
						return 'testValueWithD';
					}
					if (key === 'testValueWithOutD') {
						return 'true';
					}

					return undefined;
				});

				const result = configFactory.loadAndValidateConfigs(TestConfig);

				expect(result.TEST_VALUE).toEqual('test');
				expect(result.testValueWithD).toEqual('testValueWithD');
				expect(result.testValue2).toEqual('test2');
			});
		});

		describe('when value is not valid', () => {
			it('should throw error', () => {
				jest.spyOn(configService, 'get').mockImplementation((key: string) => {
					if (key === 'TEST_VALUE_1') {
						return 123;
					}
					if (key === 'TEST_VALUE2') {
						return 'test2';
					}
					if (key === 'testValueWithD') {
						return 'testValueWithD';
					}
					if (key === 'testValueWithOutD') {
						return 'true';
					}

					return undefined;
				});

				expect(() => configFactory.loadAndValidateConfigs(TestConfig)).toThrow(/isString/);
			});
		});

		describe('when The class is not decorated with @Configuration()', () => {
			class InvalidConfig {
				@IsString()
				@ConfigProperty('TEST_VALUE_1')
				public TEST_VALUE!: string;
			}

			it('should throw error', () => {
				expect(() => configFactory.loadAndValidateConfigs(InvalidConfig)).toThrow(
					`The class InvalidConfig is not decorated with @Configuration()`
				);
			});
		});
	});
});
