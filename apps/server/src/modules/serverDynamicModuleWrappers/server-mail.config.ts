import { ConfigProperty, Configuration } from '@infra/configuration';
import { InternalMailModuleConfig } from '@infra/mail';
import { CommaSeparatedStringToArray } from '@shared/controller/transformer/comma-separated-string-to-array.transformer';
import { IsArray, IsString } from 'class-validator';

export const SERVER_MAIL_CONFIG_TOKEN = 'SERVER_MAIL_CONFIG_TOKEN';

@Configuration()
export class MailConfig implements InternalMailModuleConfig {
	@ConfigProperty('MAIL_SEND_EXCHANGE')
	@IsString()
	public mailSendExchange = 'mail-drop';

	@ConfigProperty('MAIL_SEND_ROUTING_KEY')
	@IsString()
	public mailSendRoutingKey = 'mail-drop';

	@ConfigProperty('BLOCKLIST_OF_EMAIL_DOMAINS')
	@CommaSeparatedStringToArray()
	@IsArray()
	public blocklistOfEmailDomains: string[] = [];
}
