import { AuthorizationService } from '@modules/authorization';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { LearnroomConfig } from '../learnroom.config';
import { CommonCartridgeImportService } from '../service';

@Injectable()
export class CourseImportUc {
	public constructor(
		private readonly configService: ConfigService<LearnroomConfig, true>,
		private readonly authorizationService: AuthorizationService,
		private readonly courseImportService: CommonCartridgeImportService
	) {}

	public async importFromCommonCartridge(userId: EntityId, file: Buffer): Promise<void> {
		if (!this.configService.getOrThrow<boolean>('FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_ENABLED')) {
			throw new NotFoundException();
		}

		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkAllPermissions(user, [Permission.COURSE_CREATE]);

		await this.courseImportService.importFile(user, file);
	}
}
