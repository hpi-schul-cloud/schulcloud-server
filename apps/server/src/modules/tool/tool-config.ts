export interface ToolConfig {
	PUBLIC_BACKEND_URL: string;
}

import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber, IsString, IsUrl } from 'class-validator';

export const TOOL_PUBLIC_API_CONFIG_TOKEN = 'TOOL_PUBLIC_API_CONFIG_TOKEN';
export const TOOL_CONFIG_TOKEN = 'TOOL_CONFIG_TOKEN';

@Configuration()
export class ToolPublicApiConfig {
	@ConfigProperty('CTL_TOOLS_RELOAD_TIME_MS')
	@StringToNumber()
	@IsNumber()
	public ctlToolsReloadTimeMs = 299000;

	@ConfigProperty('FEATURE_VIDIS_MEDIA_ACTIVATIONS_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureVidisMediaActivationsEnabled = false;

	@ConfigProperty('FEATURE_PREFERRED_CTL_TOOLS_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featurePreferredCtlToolsEnabled = false;

	@ConfigProperty('FEATURE_CTL_TOOLS_COPY_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureCtlToolsCopyEnabled = false;
}

@Configuration()
export class ToolConfig extends ToolPublicApiConfig {
	@ConfigProperty('FEATURE_SCHULCONNEX_MEDIA_LICENSE_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureSchulconnexMediaLicenseEnabled = false;

	@ConfigProperty('CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES')
	@IsNumber()
	@StringToNumber()
	public ctlToolsExternalToolMaxLogoSizeInBytes = 300000;

	@ConfigProperty('CTL_TOOLS_BACKEND_URL')
	@IsUrl({ require_tld: false })
	public ctlToolsBackendUrl!: string;

	@ConfigProperty('CTL_TOOLS__PREFERRED_TOOLS_LIMIT')
	@IsNumber()
	@StringToNumber()
	public ctlToolsPreferredToolsLimit = 5;

	@ConfigProperty('PUBLIC_BACKEND_URL')
	@IsUrl({ require_tld: false })
	public publicBackendUrl!: string;

	@ConfigProperty('SC_TITLE')
	@IsString()
	public scTitle = 'dBildungscloud';
}
