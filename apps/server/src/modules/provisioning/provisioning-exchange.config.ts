import { Configuration } from '@infra/configuration';
import { InternalRabbitMQExchangeConfig, RabbitMQExchangeType } from '@infra/rabbitmq';
import { IsString } from 'class-validator';

export interface InternalProvisioningExchangeConfig extends InternalRabbitMQExchangeConfig {}

export const PROVISIONING_EXCHANGE_NAME = 'provisioning-schulconnex';
export const PROVISIONING_EXCHANGE_CONFIG_TOKEN = 'PROVISIONING_EXCHANGE_CONFIG_TOKEN';

@Configuration()
export class ProvisioningExchangeConfig implements InternalRabbitMQExchangeConfig {
	@IsString()
	public exchangeName = PROVISIONING_EXCHANGE_NAME;

	@IsString()
	public exchangeType = RabbitMQExchangeType.DIRECT;
}
