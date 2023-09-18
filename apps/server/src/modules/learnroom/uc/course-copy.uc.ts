import { Configuration } from '@hpi-schul-cloud/commons';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { AuthorizationContextBuilder } from '@src/modules/authorization';
import { AuthorizationReferenceService, AuthorizableReferenceType } from '@src/modules/authorization/domain/reference';
import { CopyStatus } from '@src/modules/copy-helper';
import { CourseCopyService } from '../service';

@Injectable()
export class CourseCopyUC {
	constructor(
		private readonly authorization: AuthorizationReferenceService,
		private readonly courseCopyService: CourseCopyService
	) {}

	async copyCourse(userId: EntityId, courseId: EntityId): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		const context = AuthorizationContextBuilder.write([Permission.COURSE_CREATE]);
		await this.authorization.checkPermissionByReferences(userId, AuthorizableReferenceType.Course, courseId, context);

		const result = await this.courseCopyService.copyCourse({ userId, courseId });

		return result;
	}

	private checkFeatureEnabled() {
		// @hpi-schul-cloud/commons is deprecated way to get envirements
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
