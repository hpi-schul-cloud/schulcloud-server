import { ConfigProperty, Configuration } from '@infra/configuration';
import { EtherpadClientConfig as InternalEtherpadClientConfig } from '@infra/etherpad-client';
import { IsString, IsUrl } from 'class-validator';

@Configuration()
export class EtherpadClientConfig implements InternalEtherpadClientConfig {
	@ConfigProperty('ETHERPAD__API_KEY')
	@IsString()
	public apiKey = 'defaultApiKey';

	@ConfigProperty('ETHERPAD__URI')
	@IsUrl({ require_tld: false })
	public basePath = 'http://default/api/1.2.14';
}
