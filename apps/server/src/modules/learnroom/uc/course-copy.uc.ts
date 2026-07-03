import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CopyStatus } from '@modules/copy-helper';
import { CourseDoService } from '@modules/course';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { LEARNROOM_CONFIG_TOKEN, LearnroomConfig } from '../learnroom.config';
import { CourseCopyService } from '../service';

@Injectable()
export class CourseCopyUC {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly courseCopyService: CourseCopyService,
		private readonly courseDoService: CourseDoService,
		@Inject(LEARNROOM_CONFIG_TOKEN) private readonly config: LearnroomConfig
	) {}

	public async copyCourse(userId: EntityId, courseId: EntityId): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		const [course, user] = await Promise.all([
			this.courseDoService.findById(courseId),
			this.authorizationService.getUserWithPermissions(userId),
		]);
		const context = AuthorizationContextBuilder.write([Permission.COURSE_CREATE]);
		this.authorizationService.checkPermission(user, course, context);

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
