import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Action } from '@src/modules/authorization/types/action.enum';
import { AuthorizableReferenceType } from '@src/modules/authorization/types/allowed-authorization-object-type.enum';
import { CommonCartridgeVersion } from '../common-cartridge/common-cartridge-enums';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';

@Injectable()
export class CourseExportUc {
	constructor(
		private readonly courseExportService: CommonCartridgeExportService,
		private readonly authorizationService: AuthorizationService
	) {}

	async exportCourse(courseId: EntityId, userId: EntityId, version: CommonCartridgeVersion): Promise<Buffer> {
		await this.authorizationService.checkPermissionByReferences(userId, AuthorizableReferenceType.Course, courseId, {
			action: Action.read,
			requiredPermissions: [Permission.COURSE_EDIT],
		});
		return this.courseExportService.exportCourse(courseId, userId, version);
	}
}
