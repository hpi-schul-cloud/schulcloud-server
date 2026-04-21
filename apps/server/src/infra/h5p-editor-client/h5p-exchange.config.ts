import { Configuration } from '@infra/configuration';
import { InternalRabbitMQExchangeConfig, RabbitMQExchangeType } from '@infra/rabbitmq';
import { IsString } from 'class-validator';

export const H5P_EXCHANGE_NAME = 'h5p-editor';

export const H5P_EXCHANGE_CONFIG_TOKEN = 'H5P_EXCHANGE_CONFIG_TOKEN';

@Configuration()
export class H5pExchangeConfig implements InternalRabbitMQExchangeConfig {
	@IsString()
	public exchangeName = H5P_EXCHANGE_NAME;

	@IsString()
	public exchangeType = RabbitMQExchangeType.DIRECT;
}
