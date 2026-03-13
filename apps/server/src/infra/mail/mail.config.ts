import { ConfigProperty, Configuration } from '@infra/configuration';
import { InternalRabbitMQExchangeConfig, RabbitMQExchangeType } from '@infra/rabbitmq';
import { CommaSeparatedStringToArray } from '@shared/controller/transformer/comma-separated-string-to-array.transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';
import { InternalMailConfig } from './interfaces';
import { StringToBoolean } from '@shared/controller/transformer';

export const MAIL_CONFIG_TOKEN = 'MAIL_CONFIG_TOKEN';
export const MAIL_EXCHANGE_CONFIG_TOKEN = 'MAIL_EXCHANGE_CONFIG_TOKEN';

@Configuration()
export class MailExchange implements InternalRabbitMQExchangeConfig {
	@ConfigProperty('MAIL_SEND_EXCHANGE')
	@IsString()
	public exchangeName = 'mail-drop';

	@ConfigProperty('MAIL_SEND_EXCHANGE_TYPE')
	@IsString()
	public exchangeType = RabbitMQExchangeType.DIRECT;
}

@Configuration()
export class MailConfig extends MailExchange implements InternalMailConfig {
	@ConfigProperty('MAIL_SEND_ROUTING_KEY')
	@IsString()
	public mailSendRoutingKey = 'mail-drop';

	@ConfigProperty('BLOCKLIST_OF_EMAIL_DOMAINS')
	@CommaSeparatedStringToArray()
	@IsArray()
	public blocklistOfEmailDomains: string[] = [];

	@ConfigProperty('FORCE_SEND_EMAIL')
	@StringToBoolean()
	@IsBoolean()
	public shouldSendEmail = false;
}
