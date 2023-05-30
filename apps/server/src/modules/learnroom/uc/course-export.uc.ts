import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { Action, AuthorizationService, AuthorizableReferenceType } from '@src/modules/authorization';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';

@Injectable()
export class CourseExportUc {
	constructor(
		private readonly courseExportService: CommonCartridgeExportService,
		private readonly authorizationService: AuthorizationService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId, version: string): Promise<Buffer> {
		await this.authorizationService.checkPermissionByReferences(userId, AuthorizableReferenceType.Course, courseId, {
			action: Action.read,
			requiredPermissions: [Permission.COURSE_EDIT],
		});
		return this.courseExportService.exportCourse(courseId, userId, version);
	}
}
