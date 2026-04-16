import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean } from '@shared/controller/transformer/string-to-boolean.transformer';
import { IsBoolean } from 'class-validator';

export const COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN = 'COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN';
export const COMMON_CARTRIDGE_CONFIG_TOKEN = 'COMMON_CARTRIDGE_CONFIG_TOKEN';

@Configuration()
export class CommonCartridgePublicApiConfig {
	@ConfigProperty('FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public courseImportEnabled = false;
	@ConfigProperty('FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED')
	@StringToBoolean()
	@IsBoolean()
	public courseExportEnabled = false;
}

@Configuration()
export class CommonCartridgeConfig extends CommonCartridgePublicApiConfig {
	@ConfigProperty('FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE')
	public courseImportMaxFileSize = 2000000000; // 2GB
}
