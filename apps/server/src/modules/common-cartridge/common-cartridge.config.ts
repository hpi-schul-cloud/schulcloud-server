import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToNumber } from '@shared/controller/transformer';
import { StringToBoolean } from '@shared/controller/transformer/string-to-boolean.transformer';
import { IsBoolean, IsNumber } from 'class-validator';

export const COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN = 'COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN';

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
	public courseImportMaxFileSize = 1073741824; // 1GB
}
