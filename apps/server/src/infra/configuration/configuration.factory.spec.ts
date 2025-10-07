import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StringToBoolean } from '@shared/controller/transformer';
import { IsBoolean, IsString } from 'class-validator';
import { ConfigProperty, Configuration } from './configuration.decorator';
import { ConfigurationFactory } from './configuration.factory';

@Configuration()
class TestConfig {
	@IsString()
	@ConfigProperty('TEST_VALUE_1')
	public valueWithOtherEnvVar!: string;

	@IsString()
	@ConfigProperty('TEST_VALUE2')
	public valueWithOtherEnvVarAndDefault = 'default';

	@IsString()
	@ConfigProperty()
	public valueWithoutDefault!: string;

	@IsBoolean()
	@StringToBoolean()
	@ConfigProperty()
	public valueWithoutDefaultBoolean!: boolean;

	@IsBoolean()
	public valueWithDefaultBoolean = true;
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

	describe('loadAndValidateConfigs', () => {
		describe('when value is valid', () => {
			const setup = () => {
				jest.spyOn(configService, 'get').mockImplementation((key: string) => {
					if (key === 'TEST_VALUE_1') {
						return 'test';
					}
					if (key === 'TEST_VALUE2') {
						return 'test2';
					}
					if (key === 'valueWithoutDefault') {
						return 'testValueWithD';
					}
					if (key === 'valueWithoutDefaultBoolean') {
						return 'true';
					}

					return undefined;
				});
			};
			describe('when @ConfigProperty("TEST_VALUE_1") is provided by env variable', () => {
				it('should return the correct value', () => {
					setup();
					const result = configFactory.loadAndValidateConfigs(TestConfig);

					expect(result.valueWithOtherEnvVar).toEqual('test');
				});
			});

			describe('when @ConfigProperty("TEST_VALUE2") is provided by env variable', () => {
				it('should return the correct value', () => {
					setup();
					const result = configFactory.loadAndValidateConfigs(TestConfig);

					expect(result.valueWithOtherEnvVarAndDefault).toEqual('test2');
				});
			});

			describe('when @ConfigProperty() without default is provided by env variable', () => {
				it('should return the correct value', () => {
					setup();
					const result = configFactory.loadAndValidateConfigs(TestConfig);

					expect(result.valueWithoutDefault).toEqual('testValueWithD');
				});
			});

			describe('when @ConfigProperty() without default is provided by env variable and transformed to boolean', () => {
				it('should return the correct value', () => {
					setup();
					const result = configFactory.loadAndValidateConfigs(TestConfig);

					expect(result.valueWithoutDefaultBoolean).toEqual(true);
				});
			});

			describe('when @ConfigProperty() with default is not provided by env variable', () => {
				it('should return the default value', () => {
					setup();
					const result = configFactory.loadAndValidateConfigs(TestConfig);

					expect(result.valueWithDefaultBoolean).toEqual(true);
				});
			});
		});

		describe('when value is not valid', () => {
			const setup = () => {
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
					if (key === 'testValueWith') {
						return 'true';
					}

					return undefined;
				});
			};
			it('should throw error', () => {
				setup();
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
