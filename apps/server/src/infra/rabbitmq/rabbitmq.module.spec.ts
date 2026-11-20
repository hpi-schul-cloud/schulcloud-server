import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigProperty, Configuration } from '@infra/configuration';
import { Test, type TestingModule } from '@nestjs/testing';
import { IsString } from 'class-validator';
import {
	type InternalRabbitMQExchangeConfig,
	RabbitMQExchangeType,
	type RabbitMQModuleOptions,
	type RabbitMQQueueOptions,
} from './rabbitmq-module.options';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from './rabbitmq.config';
import { RabbitMQWrapperModule } from './rabbitmq.module';

const TEST_EXCHANGE_CONFIG_TOKEN = 'TEST_EXCHANGE_CONFIG_TOKEN';

@Configuration()
class TestExchangeConfig implements InternalRabbitMQExchangeConfig {
	@ConfigProperty('RABBITMQ_MODULE_TEST_EXCHANGE')
	@IsString()
	public exchangeName = 'rabbitmq-module-test';

	@ConfigProperty('RABBITMQ_MODULE_TEST_EXCHANGE_TYPE')
	@IsString()
	public exchangeType = RabbitMQExchangeType.DIRECT;
}

describe(RabbitMQWrapperModule.name, () => {
	const options: RabbitMQModuleOptions = {
		exchangeConfigInjectionToken: TEST_EXCHANGE_CONFIG_TOKEN,
		exchangeConfigConstructor: TestExchangeConfig,
		configInjectionToken: RABBITMQ_CONFIG_TOKEN,
		configConstructor: RabbitMQConfig,
		connectionName: 'rabbitmq-module-test',
	};

	describe('register', () => {
		describe('when no queues are given', () => {
			let module: TestingModule;

			beforeAll(async () => {
				module = await Test.createTestingModule({
					imports: [RabbitMQWrapperModule.register(options)],
				}).compile();
				await module.init();
			});

			afterAll(async () => {
				await module.close();
			});

			const setup = () => {
				const amqpConnection = module.get(AmqpConnection);
				const exchangeConfig = module.get<TestExchangeConfig>(TEST_EXCHANGE_CONFIG_TOKEN);

				return { amqpConnection, exchangeConfig };
			};

			it('should connect and declare the exchange', async () => {
				const { amqpConnection, exchangeConfig } = setup();

				await expect(amqpConnection.channel.checkExchange(exchangeConfig.exchangeName)).resolves.toBeDefined();
			});

			it('should configure no queues', () => {
				const { amqpConnection } = setup();

				expect(amqpConnection.configuration.queues).toEqual([]);
			});
		});

		describe('when queues are given', () => {
			let module: TestingModule;
			const queueOptions: RabbitMQQueueOptions = {
				name: 'rabbitmq-module-test-queue',
				routingKey: 'rabbitmq-module-test-key',
			};

			beforeAll(async () => {
				module = await Test.createTestingModule({
					imports: [RabbitMQWrapperModule.register({ ...options, queues: [queueOptions] })],
				}).compile();
				await module.init();
			});

			afterAll(async () => {
				const amqpConnection = module.get(AmqpConnection);
				const exchangeConfig = module.get<TestExchangeConfig>(TEST_EXCHANGE_CONFIG_TOKEN);
				await amqpConnection.channel.deleteQueue(queueOptions.name);
				await amqpConnection.channel.deleteExchange(exchangeConfig.exchangeName);
				await module.close();
			});

			const setup = () => {
				const amqpConnection = module.get(AmqpConnection);
				const exchangeConfig = module.get<TestExchangeConfig>(TEST_EXCHANGE_CONFIG_TOKEN);

				return { amqpConnection, exchangeConfig, queue: queueOptions };
			};

			it('should declare the queues', async () => {
				const { amqpConnection, queue } = setup();

				const result = await amqpConnection.channel.checkQueue(queue.name);

				expect(result.queue).toEqual(queue.name);
			});

			it('should bind the queues to the exchange of the module', async () => {
				const { amqpConnection, exchangeConfig, queue } = setup();
				await amqpConnection.channel.purgeQueue(queue.name);

				await amqpConnection.publish(exchangeConfig.exchangeName, queue.routingKey, { test: true });

				const message = await amqpConnection.channel.get(queue.name, { noAck: true });
				expect(message && JSON.parse(message.content.toString())).toEqual({ test: true });
			});
		});
	});
});
