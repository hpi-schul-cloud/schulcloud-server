import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber } from 'class-validator';

export const COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN = 'COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN';
export const COMMON_CARTRIDGE_CONFIG_TOKEN = 'COMMON_CARTRIDGE_CONFIG_TOKEN';

// 1GB in bytes - shared constant for both frontend and backend
export const DEFAULT_MAX_FILE_SIZE_BYTES = 1048576;

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

	@ConfigProperty('FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE')
	@StringToNumber()
	@IsNumber()
	public courseImportMaxFileSize: number = DEFAULT_MAX_FILE_SIZE_BYTES;
}

@Configuration()
export class CommonCartridgeConfig extends CommonCartridgePublicApiConfig {}
