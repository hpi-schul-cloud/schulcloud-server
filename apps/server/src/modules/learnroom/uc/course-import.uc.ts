import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { AuthorizationService } from '@src/modules/authorization';
import { CommonCartridgeImportService, CourseService } from '../service';
import { LearnroomConfigService } from '../service/learnroom-config.service';

@Injectable()
export class CourseImportUc {
	public constructor(
		private readonly courseService: CourseService,
		private readonly configService: LearnroomConfigService,
		private readonly authorizationService: AuthorizationService,
		private readonly courseImportService: CommonCartridgeImportService
	) {}

	public async importFromCommonCartridge(userId: EntityId, file: Buffer): Promise<void> {
		if (!this.configService.isCommonCartridgeCourseImportEnabled) {
			throw new NotFoundException();
		}

		const user = await this.authorizationService.getUserWithPermissions(userId);

		this.authorizationService.checkAllPermissions(user, [Permission.COURSE_CREATE]);

		const course = this.courseImportService.createCourse(user, file);

		await this.courseService.create(course);
	}
}
