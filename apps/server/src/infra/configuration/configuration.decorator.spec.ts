import { IsString } from 'class-validator';
import { ConfigProperty, Configuration } from './configuration.decorator';

@Configuration()
class TestConfig {
	@IsString()
	@ConfigProperty('TEST_VALUE')
	public testValue1!: string;

	@IsString()
	@ConfigProperty('TEST_VALUE2')
	public testValue2 = 'xyz';

	@IsString()
	@ConfigProperty()
	public testValue3 = 'test';

	@IsString()
	@ConfigProperty()
	public testValue4!: string;

	@IsString()
	public testValue5 = 'test5';

	@IsString()
	public testValue6!: string;
}

describe('Configuration Decorator', () => {
	it('should add property to configMap with PropertyAccess key', () => {
		const config = new TestConfig();

		config.testValue1 = 'abc';
		config.testValue6 = 'N';

		expect(config.testValue1).toBe('abc');
		expect(config.testValue2).toBe('xyz');
		expect(config.testValue3).toBe('test');
		expect(config.testValue4).toBeUndefined();
		expect(config.testValue5).toBe('test5');
		expect(config.testValue6).toBe('N');
	});
});
