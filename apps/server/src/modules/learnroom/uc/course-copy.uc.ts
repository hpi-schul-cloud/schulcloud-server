import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthorizableReferenceType, AuthorizationContextBuilder } from '@modules/authorization';
import { AuthorizationReferenceService } from '@modules/authorization-reference';
import { CopyStatus } from '@modules/copy-helper';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CourseCopyService } from '../service';

@Injectable()
export class CourseCopyUC {
	constructor(
		private readonly authorization: AuthorizationReferenceService,
		private readonly courseCopyService: CourseCopyService
	) {}

	public async copyCourse(userId: EntityId, courseId: EntityId): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		const context = AuthorizationContextBuilder.write([Permission.COURSE_CREATE]);
		await this.authorization.checkPermissionByReferences(userId, AuthorizableReferenceType.Course, courseId, context);

		const result = await this.courseCopyService.copyCourse({ userId, courseId });

		return result;
	}

	private checkFeatureEnabled(): void {
		// @hpi-schul-cloud/commons is deprecated way to get envirements
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
