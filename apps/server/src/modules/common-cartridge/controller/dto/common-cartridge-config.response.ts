import { CommonCartridgePublicApiConfig } from '@modules/common-cartridge/';
import { ApiProperty } from '@nestjs/swagger';

export class CommonCartridgeConfigResponse {
	@ApiProperty()
	public readonly FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED: boolean;

	@ApiProperty()
	public readonly FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED: boolean;

	@ApiProperty()
	public readonly FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: number;

	constructor(config: CommonCartridgePublicApiConfig) {
		this.FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED = config.courseImportEnabled;
		this.FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED = config.courseExportEnabled;
		this.FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE = config.courseImportMaxFileSize;
	}
}
