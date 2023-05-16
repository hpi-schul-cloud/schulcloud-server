import { Configuration } from '@hpi-schul-cloud/commons';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { Action, AuthorizationService, AllowedAuthorizationObjectType } from '@src/modules/authorization';
import { CopyStatus } from '@src/modules/copy-helper';
import { CourseCopyService } from '../service';

@Injectable()
export class CourseCopyUC {
	constructor(
		private readonly authorization: AuthorizationService,
		private readonly courseCopyService: CourseCopyService
	) {}

	async copyCourse(userId: EntityId, courseId: EntityId): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		await this.authorization.checkPermissionByReferences(userId, AllowedAuthorizationObjectType.Course, courseId, {
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
