import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export const PROVISIONING_CONFIG_TOKEN = 'PROVISIONING_CONFIG_TOKEN';
export const PROVISIONING_PUBLIC_API_CONFIG = 'PROVISIONING_PUBLIC_API_CONFIG_TOKEN';

@Configuration()
export class ProvisioningPublicApiConfig {
	@ConfigProperty('FEATURE_SCHULCONNEX_COURSE_SYNC_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureSchulconnexCourseSyncEnabled = false;

	@ConfigProperty('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureSchulconnexMediaLicenseEnabled = false;
}

@Configuration()
export class ProvisioningConfig extends ProvisioningPublicApiConfig {
	@ConfigProperty('PROVISIONING_SCHULCONNEX_POLICIES_INFO_URL')
	@IsString()
	public provisioningSchulconnexPoliciesInfoUrl = '';

	@ConfigProperty('PROVISIONING_SCHULCONNEX_GROUP_USERS_LIMIT')
	@IsOptional()
	@IsNumber()
	@StringToNumber()
	public provisioningSchulconnexGroupUsersLimit?: number;

	@ConfigProperty('FEATURE_SCHULCONNEX_GROUP_PROVISIONING_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureSchulconnexGroupProvisioningEnabled = false;

	@ConfigProperty('FEATURE_OTHER_GROUPUSERS_PROVISIONING_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public featureOtherGroupusersProvisioningEnabled = false;

	@ConfigProperty('SCHULCONNEX_COURSE_SYNC_HISTORY_EXPIRATION_SECONDS')
	@IsNumber()
	@StringToNumber()
	public schulconnexCourseSyncHistoryExpirationSeconds = 864000;
}
