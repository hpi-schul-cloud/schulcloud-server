import { ConfigProperty, Configuration } from '@infra/configuration';
import { InternalRabbitMQExchange } from '@infra/rabbitmq';
import { IsString } from 'class-validator';

export interface InternalProvisioningExchangeConfig extends InternalRabbitMQExchange {}

export const PROVISIONING_EXCHANGE_CONFIG_TOKEN = 'PROVISIONING_EXCHANGE_CONFIG_TOKEN';

@Configuration()
export class ProvisioningExchangeConfig implements InternalRabbitMQExchange {
	@ConfigProperty('PROVISIONING_SCHULCONNEX_EXCHANGE')
	@IsString()
	public exchangeName = 'provisioning-schulconnex';

	@ConfigProperty('PROVISIONING_SCHULCONNEX_EXCHANGE_TYPE')
	@IsString()
	public exchangeType = 'direct';
}
