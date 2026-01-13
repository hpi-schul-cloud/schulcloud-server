import { ConfigProperty, Configuration } from '@infra/configuration';
import { IsNumber, IsUrl } from 'class-validator';

export const COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN = 'COLLABORATIVE_TEXT_EDITOR_CONFIG_TOKEN';

@Configuration()
export class CollaborativeTextEditorConfig {
	@ConfigProperty('ETHERPAD__COOKIE_RELEASE_THRESHOLD')
	@IsNumber()
	public cookieReleaseThreshold = 7200;

	@ConfigProperty('ETHERPAD__COOKIE_EXPIRES_SECONDS')
	@IsNumber()
	public cookieExpiresInSeconds = 7200;

	/**
	 * The default value only exists because the SchulconnexLicenseProvisioningAMQPModule
	 * has an unnecessary dependency on this module.
	 * After resolving this dependency, this default value can be removed.
	 */
	@ConfigProperty('ETHERPAD__PAD_URI')
	@IsUrl({ require_tld: false })
	public padUri = 'http://default/p/';
}
