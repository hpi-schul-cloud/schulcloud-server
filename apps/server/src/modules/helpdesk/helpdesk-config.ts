import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsEmail, IsString } from 'class-validator';

export const HELPDESK_CONFIG_TOKEN = 'HELPDESK_CONFIG_TOKEN';
@Configuration()
export class HelpdeskConfig {
	@ConfigProperty('SUPPORT_PROBLEM_EMAIL_ADDRESS')
	@IsEmail()
	public problemEmailAddress = 'ticketsystem@dbildungscloud.de';

	@ConfigProperty('SUPPORT_WISH_EMAIL_ADDRESS')
	@IsEmail()
	public wishEmailAddress = 'ticketsystem@dbildungscloud.de';

	@ConfigProperty('SMTP_SENDER')
	@IsEmail()
	public fromEmailAddress = 'noreply@dbildungscloud.de';

	@ConfigProperty('SC_TITLE')
	@IsString()
	public instanceName = 'Default Instance';
}
