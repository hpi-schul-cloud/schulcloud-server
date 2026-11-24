import { ConfigProperty, Configuration } from '@infra/configuration';
import { type InternalRabbitMQConfig } from '@infra/rabbitmq';
import { StringToNumber } from '@shared/controller/transformer';
import { IsInt, IsNumber, IsUrl, Min } from 'class-validator';

export const BOARD_IMPORT_RABBITMQ_CONFIG_TOKEN = 'BOARD_IMPORT_RABBITMQ_CONFIG_TOKEN';

@Configuration()
export class BoardImportRabbitMQConfig implements InternalRabbitMQConfig {
	// The prefetch count is the number of import jobs that one worker processes at the same time.
	@ConfigProperty('BOARD_IMPORT_PREFETCH_COUNT')
	@StringToNumber()
	@IsInt()
	@Min(1)
	public prefetchCount = 1;

	@ConfigProperty('RABBITMQ_HEARTBEAT_INTERVAL_IN_SECONDS')
	@StringToNumber()
	@IsNumber()
	public heartBeatIntervalInSeconds = 20;

	@ConfigProperty('RABBITMQ_URI')
	@IsUrl({ require_tld: false, require_valid_protocol: false })
	public uri!: string;
}
