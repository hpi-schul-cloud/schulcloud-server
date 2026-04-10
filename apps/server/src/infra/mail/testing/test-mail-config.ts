import { ConfigProperty, Configuration } from '@infra/configuration';
import { RabbitMQExchangeType } from '@infra/rabbitmq';
import { StringToBoolean } from '@shared/controller/transformer';
import { CommaSeparatedStringToArray } from '@shared/controller/transformer/comma-separated-string-to-array.transformer';
import { IsArray, IsBoolean, IsString } from 'class-validator';
import { InternalMailConfig } from '../interfaces';

export const TEST_MAIL_CONFIG_TOKEN = 'TEST_MAIL_CONFIG_TOKEN';

@Configuration()
export class TestMailConfig implements InternalMailConfig {
	@ConfigProperty('MAIL_SEND_EXCHANGE')
	@IsString()
	public exchangeName = 'mail-drop';

	@ConfigProperty('MAIL_SEND_EXCHANGE_TYPE')
	@IsString()
	public exchangeType = RabbitMQExchangeType.DIRECT;

	@ConfigProperty('MAIL_SEND_ROUTING_KEY')
	@IsString()
	public mailSendRoutingKey = 'mail-drop';

	@ConfigProperty('BLOCKLIST_OF_EMAIL_DOMAINS')
	@CommaSeparatedStringToArray()
	@IsArray()
	public blocklistOfEmailDomains: string[] = [];

	@ConfigProperty('SHOULD_SEND_EMAIL')
	@StringToBoolean()
	@IsBoolean()
	public shouldSendEmail = false;
}
