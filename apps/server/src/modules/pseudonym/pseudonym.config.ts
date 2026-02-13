import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsUrl } from 'class-validator';

export const PSEUDONYM_CONFIG_TOKEN = 'PSEUDONYM_CONFIG_TOKEN';

@Configuration()
export class PseudonymConfig {
	@IsUrl({ require_tld: false })
	@ConfigProperty('HOST')
	public hostUrl!: string;
}
