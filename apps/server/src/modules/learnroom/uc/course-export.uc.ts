import { Injectable } from '@nestjs/common';
import { Action, EntityId, Permission } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';

@Injectable()
export class CourseExportUc {
	constructor(
		private readonly courseExportService: CommonCartridgeExportService,
		private readonly authorizationService: AuthorizationService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId): Promise<Buffer> {
		await this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.Course,
			courseId,
			{
				action: Action.read,
				requiredPermissions: [Permission.COURSE_EDIT],
			}
		);
		return this.courseExportService.exportCourse(courseId, userId);
	}
}
