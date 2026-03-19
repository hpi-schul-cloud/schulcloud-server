import { ConfigProperty, Configuration } from '@infra/configuration';
import { StringToBoolean, StringToNumber } from '@shared/controller/transformer';
import { IsBoolean, IsNumber } from 'class-validator';

export const LEARNROOM_PUBLIC_API_CONFIG_TOKEN = 'LEARNROOM_PUBLIC_API_CONFIG_TOKEN';
export const LEARNROOM_CONFIG_TOKEN = 'LEARNROOM_CONFIG_TOKEN';

@Configuration()
export class LearnroomPublicApiConfig {
	@ConfigProperty('FEATURE_COLUMN_BOARD_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureColumnBoardEnabled = true;
}

@Configuration()
export class LearnroomConfig extends LearnroomPublicApiConfig {
	@ConfigProperty('FEATURE_COMMON_CARTRIDGE_COURSE_EXPORT_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureCommonCartridgeCourseExportEnabled = false;

	@ConfigProperty('FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureCommonCartridgeCourseImportEnabled = false;

	@ConfigProperty('FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE')
	@IsNumber()
	@StringToNumber()
	public featureCommonCartridgeCourseImportMaxFileSize = 2000000000;

	@ConfigProperty('FEATURE_COPY_SERVICE_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureCopyServiceEnabled = false;

	@ConfigProperty('FEATURE_CTL_TOOLS_COPY_ENABLED')
	@IsBoolean()
	@StringToBoolean()
	public featureCtlToolsCopyEnabled = false;
}
