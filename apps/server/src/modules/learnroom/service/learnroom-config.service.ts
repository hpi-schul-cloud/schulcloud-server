import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LearnroomConfig } from '../learnroom.config';

@Injectable()
export class LearnroomConfigService {
	constructor(private readonly configService: ConfigService<LearnroomConfig, true>) {}

	public get isCommonCartridgeCourseImportEnabled(): boolean {
		return this.configService.get('FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED', false);
	}

	public get commonCartridgeImportMaxFileSize(): number {
		return this.configService.get('FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE', 1000 * 1000 * 1000); // 1GB
	}
}
