import { ConfigProperty, Configuration } from '@infra/configuration';
import { InternalRabbitMQExchangeConfig, RabbitMQExchangeType } from '@infra/rabbitmq';
import { IsString } from 'class-validator';

export const BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN = 'BOARD_IMPORT_EXCHANGE_CONFIG_TOKEN';

@Configuration()
export class BoardImportExchangeConfig implements InternalRabbitMQExchangeConfig {
	@ConfigProperty('BOARD_IMPORT_EXCHANGE')
	@IsString()
	public exchangeName = 'board-import';

	@ConfigProperty('BOARD_IMPORT_EXCHANGE_TYPE')
	@IsString()
	public exchangeType = RabbitMQExchangeType.DIRECT;
}
