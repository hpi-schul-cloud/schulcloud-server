import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsString, IsUrl } from 'class-validator';

@Configuration()
export class EtherpadClientConfig {
	@ConfigProperty('ETHERPAD__API_KEY')
	@IsString()
	public apiKey = 'defaultApiKey';

	@ConfigProperty('ETHERPAD__URI')
	@IsUrl({ require_tld: false })
	public basePath = 'http://default/api/1.2.14';
}
