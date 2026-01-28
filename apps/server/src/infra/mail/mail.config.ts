import { ConfigProperty, Configuration } from '@infra/configuration';
import { InternalRabbitMQExchange } from '@infra/rabbitmq';
import { CommaSeparatedStringToArray } from '@shared/controller/transformer/comma-separated-string-to-array.transformer';
import { IsArray, IsString } from 'class-validator';
import { InternalMailConfig } from './interfaces';

export const MAIL_CONFIG_TOKEN = 'MAIL_CONFIG_TOKEN';
export const MAIL_EXCHANGE_CONFIG_TOKEN = 'MAIL_EXCHANGE_CONFIG_TOKEN';

@Configuration()
export class MailExchange implements InternalRabbitMQExchange {
	@ConfigProperty('MAIL_SEND_EXCHANGE')
	@IsString()
	public exchangeName = 'mail-drop';

	@ConfigProperty('MAIL_SEND_EXCHANGE_TYPE')
	@IsString()
	public exchangeType = 'direct';
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
}
