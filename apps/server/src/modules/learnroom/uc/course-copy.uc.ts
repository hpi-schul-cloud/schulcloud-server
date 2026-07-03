import {
	AuthorizationBodyParamsReferenceType,
	AuthorizationClientAdapter,
	AuthorizationContextBuilder,
} from '@infra/authorization-client';
import { CopyStatus } from '@modules/copy-helper';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { LEARNROOM_CONFIG_TOKEN, LearnroomConfig } from '../learnroom.config';
import { CourseCopyService } from '../service';

@Injectable()
export class CourseCopyUC {
	constructor(
		private readonly authorizationClientAdapter: AuthorizationClientAdapter,
		private readonly courseCopyService: CourseCopyService,
		@Inject(LEARNROOM_CONFIG_TOKEN) private readonly config: LearnroomConfig
	) {}

	public async copyCourse(userId: EntityId, courseId: EntityId): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		const context = AuthorizationContextBuilder.write([Permission.COURSE_CREATE]);
		await this.authorizationClientAdapter.checkPermissionsByReference(
			AuthorizationBodyParamsReferenceType.COURSES,
			courseId,
			context
		);

		const result = await this.courseCopyService.copyCourse({ userId, courseId });

		return result;
	}

	private checkFeatureEnabled(): void {
		const enabled = this.config.featureCopyServiceEnabled;

		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
