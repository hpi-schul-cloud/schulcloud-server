import { Configuration } from '@hpi-schul-cloud/commons';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Action } from '@src/modules/authorization/types/action.enum';
import { AuthorizableReferenceType } from '@src/modules/authorization/types/allowed-authorization-object-type.enum';
import { CopyStatus } from '@src/modules/copy-helper/types/copy.types';
import { CourseCopyService } from '../service/course-copy.service';

@Injectable()
export class CourseCopyUC {
	constructor(
		private readonly authorization: AuthorizationService,
		private readonly courseCopyService: CourseCopyService
	) {}

	async copyCourse(userId: EntityId, courseId: EntityId): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		await this.authorization.checkPermissionByReferences(userId, AuthorizableReferenceType.Course, courseId, {
			action: Action.write,
			requiredPermissions: [Permission.COURSE_CREATE],
		});

		const result = await this.courseCopyService.copyCourse({ userId, courseId });

		return result;
	}

	private checkFeatureEnabled() {
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
