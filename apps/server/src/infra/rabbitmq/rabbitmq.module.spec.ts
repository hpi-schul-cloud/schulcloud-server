import { type RabbitMQModuleOptions, RabbitMQExchangeType } from './rabbitmq-module.options';
import { RabbitMQConfig } from './rabbitmq.config';
import { RabbitMQWrapperModule } from './rabbitmq.module';

class TestExchangeConfig {
	public exchangeName = 'registration-test';
	public exchangeType = RabbitMQExchangeType.DIRECT;
}

describe(RabbitMQWrapperModule.name, () => {
	const options: RabbitMQModuleOptions = {
		connectionName: 'registration-test',
		configInjectionToken: 'REGISTRATION_CONFIG',
		configConstructor: RabbitMQConfig,
		exchangeConfigInjectionToken: 'REGISTRATION_EXCHANGE',
		exchangeConfigConstructor: TestExchangeConfig,
	};

	it('should reuse module identity for identical connection registrations', () => {
		expect(RabbitMQWrapperModule.register({ ...options })).toBe(RabbitMQWrapperModule.register({ ...options }));
	});

	it.each<Partial<RabbitMQModuleOptions>>([
		{ connectionName: 'another-connection' },
		{ configInjectionToken: 'ANOTHER_CONFIG' },
		{ configConstructor: class extends RabbitMQConfig {} },
		{ exchangeConfigInjectionToken: 'ANOTHER_EXCHANGE' },
		{ exchangeConfigConstructor: class extends TestExchangeConfig {} },
	])('should preserve distinct registrations for changed options: %p', (change) => {
		expect(RabbitMQWrapperModule.register({ ...options, ...change })).not.toBe(RabbitMQWrapperModule.register(options));
	});

	it('should snapshot registration options instead of retaining mutable caller data', () => {
		const mutable = { ...options, connectionName: 'mutable-registration' };
		const original = RabbitMQWrapperModule.register(mutable);
		mutable.connectionName = 'changed-registration';

		expect(RabbitMQWrapperModule.register({ ...options, connectionName: 'mutable-registration' })).toBe(original);
		expect(RabbitMQWrapperModule.register(mutable)).not.toBe(original);
	});
});
