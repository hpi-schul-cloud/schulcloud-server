import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber, IsUrl } from 'class-validator';
import { InternalRabbitMqConfig } from './rabbitmq-module.options';

export const RABBITMQ_CONFIG_TOKEN = 'RABBITMQ_CONFIG_TOKEN';
@Configuration()
export class RabbitMqConfig implements InternalRabbitMqConfig {
	@ConfigProperty('RABBITMQ_GLOBAL_PREFETCH_COUNT')
	@StringToNumber()
	@IsNumber()
	public prefetchCount!: number;

	@IsNumber()
	@StringToNumber()
	@ConfigProperty('RABBITMQ_HEARTBEAT_INTERVAL_IN_SECONDS')
	public heartBeatIntervalInSeconds!: number;

	@IsUrl({ require_tld: false, require_valid_protocol: false })
	@ConfigProperty('RABBITMQ_URI')
	public uri!: string;
}
