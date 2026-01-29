import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { IsNumber, IsUrl } from 'class-validator';

export const CALENDAR_CONFIG_TOKEN = 'CALENDAR_CONFIG_TOKEN';

@Configuration()
export class CalendarConfig {
	@ConfigProperty('CALENDAR_URI')
	@IsUrl({ require_tld: false })
	public calendarUri = 'http://localhost:3000';

	@ConfigProperty('REQUEST_OPTION__TIMEOUT_MS')
	@StringToNumber()
	@IsNumber()
	public timeoutMs = 5000;
}
