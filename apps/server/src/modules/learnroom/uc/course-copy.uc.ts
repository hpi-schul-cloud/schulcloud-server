import { Configuration } from '@hpi-schul-cloud/commons';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Actions, CopyHelperService, CopyStatus, EntityId, Permission } from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { BoardRepo, CourseRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { BoardCopyService, CourseCopyService, LessonCopyService } from '../service';
import { RoomsService } from './rooms.service';

@Injectable()
export class CourseCopyUC {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly boardRepo: BoardRepo,
		private readonly authorisation: AuthorizationService,
		private readonly courseCopyService: CourseCopyService,
		private readonly boardCopyService: BoardCopyService,
		private readonly roomsService: RoomsService,
		private readonly copyHelperService: CopyHelperService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly fileCopyAppendService: FileCopyAppendService
	) {}

	async copyCourse(userId: EntityId, courseId: EntityId, jwt: string): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		await this.authorisation.checkPermissionByReferences(userId, AllowedAuthorizationEntityType.Course, courseId, {
			action: Actions.write,
			requiredPermissions: [Permission.COURSE_CREATE],
		});

		const result = await this.courseCopyService.copyCourse({ userId, courseId, jwt });

		return result;
	}

	private checkFeatureEnabled() {
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
