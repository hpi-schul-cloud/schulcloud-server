import { ConfigProperty, Configuration } from '@infra/configuration';
import { InternalRabbitMQExchange } from '@infra/rabbitmq';
import { IsString } from 'class-validator';

export const H5P_EXCHANGE_CONFIG_TOKEN = 'H5P_EXCHANGE_CONFIG_TOKEN';

@Configuration()
export class H5pExchangeConfig implements InternalRabbitMQExchange {
	@ConfigProperty('H5P_EDITOR__EXCHANGE')
	@IsString()
	public exchangeName = 'h5p-editor';

	@ConfigProperty('H5P_EDITOR__EXCHANGE_TYPE')
	@IsString()
	public exchangeType = 'direct';
}
