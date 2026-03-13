import { ConfigProperty, Configuration } from '@infra/configuration';
import { InternalEtherpadClientConfig } from '@infra/etherpad-client';
import { IsString, IsUrl } from 'class-validator';

export const ETHERPAD_CLIENT_CONFIG_TOKEN = 'ETHERPAD_CLIENT_CONFIG_TOKEN';
@Configuration()
export class EtherpadClientConfig implements InternalEtherpadClientConfig {
	/**
	 * The default values only exist because the SchulconnexLicenseProvisioningAMQPModule
	 * has an unnecessary dependency on this module.
	 * After resolving this dependency, this default value can be removed.
	 */
	@ConfigProperty('ETHERPAD__API_KEY')
	@IsString()
	public apiKey = 'defaultApiKey';

	@ConfigProperty('ETHERPAD__URI')
	@IsUrl({ require_tld: false })
	public basePath = 'http://default/api/1.2.14';
}
