import { Injectable } from '@nestjs/common';
import { Actions, EntityId, Permission } from '@shared/domain';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { CourseExportService } from '../service/course-export.service';

@Injectable()
export class CourseExportUc {
	constructor(
		private readonly courseExportService: CourseExportService,
		private readonly authorizationService: AuthorizationService
	) {}

	async export(courseId: EntityId, userId: EntityId): Promise<Buffer> {
		await this.authorizationService.checkPermissionByReferences(
			userId,
			AllowedAuthorizationEntityType.Course,
			courseId,
			{
				action: Actions.read,
				requiredPermissions: [Permission.COURSE_EDIT],
			}
		);
		return this.courseExportService.exportCourse(courseId);
	}
}
