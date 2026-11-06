import { ConfigProperty, Configuration } from '@infra/configuration';
import { SchulcloudTheme } from '@shared/domain/types';
import { IsEnum, IsUrl } from 'class-validator';

export const PSEUDONYM_CONFIG_TOKEN = 'PSEUDONYM_CONFIG_TOKEN';

@Configuration()
export class PseudonymConfig {
	@IsUrl({ require_tld: false })
	@ConfigProperty('HOST')
	public hostUrl!: string;

	@IsEnum(SchulcloudTheme)
	@ConfigProperty('SC_THEME')
	public scTheme = SchulcloudTheme.DEFAULT;
}
