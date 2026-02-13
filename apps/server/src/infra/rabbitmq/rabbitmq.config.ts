import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber, IsUrl } from 'class-validator';
import { InternalRabbitMQConfig } from './rabbitmq-module.options';

export const RABBITMQ_CONFIG_TOKEN = 'RABBITMQ_CONFIG_TOKEN';

/**
 * This is default Configuration for the RabbitMQ.
 * if you need to read values from different env variables, create your own config class
 * implementing InternalRabbitMqConfig and provide it via the RabbitMqModule.register method.
 */
@Configuration()
export class RabbitMQConfig implements InternalRabbitMQConfig {
	// Please don't change the global prefetch count for the existing exchanges.
	// If you need individual prefetch counts for each consumer, please create a separate Config of RabbitMqModule with channels for your deployment.
	@ConfigProperty('RABBITMQ_GLOBAL_PREFETCH_COUNT')
	@StringToNumber()
	@IsNumber()
	public prefetchCount = 5;

	@IsNumber()
	@StringToNumber()
	@ConfigProperty('RABBITMQ_HEARTBEAT_INTERVAL_IN_SECONDS')
	public heartBeatIntervalInSeconds = 20;

	@IsUrl({ require_tld: false, require_valid_protocol: false })
	@ConfigProperty('RABBITMQ_URI')
	public uri!: string;
}
