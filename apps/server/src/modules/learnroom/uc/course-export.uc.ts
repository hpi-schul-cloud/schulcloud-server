import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { AuthorizationContextBuilder } from '@src/modules/authorization';
import { AuthorizationReferenceService, AuthorizableReferenceType } from '@src/modules/authorization/domain/reference';
import { CommonCartridgeVersion } from '../common-cartridge';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';

@Injectable()
export class CourseExportUc {
	constructor(
		private readonly courseExportService: CommonCartridgeExportService,
		private readonly authorizationService: AuthorizationReferenceService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId, version: CommonCartridgeVersion): Promise<Buffer> {
		const context = AuthorizationContextBuilder.read([Permission.COURSE_EDIT]);
		await this.authorizationService.checkPermissionByReferences(
			userId,
			AuthorizableReferenceType.Course,
			courseId,
			context
		);

		return this.courseExportService.exportCourse(courseId, userId, version);
	}
}
