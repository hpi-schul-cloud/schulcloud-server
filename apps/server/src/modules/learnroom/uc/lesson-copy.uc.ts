import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { CourseRepo } from '@shared/repo/course/course.repo';
import { LessonRepo } from '@shared/repo/lesson/lesson.repo';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { Action } from '@src/modules/authorization/types/action.enum';
import { AuthorizableReferenceType } from '@src/modules/authorization/types/allowed-authorization-object-type.enum';
import { CopyHelperService } from '@src/modules/copy-helper/service/copy-helper.service';
import { CopyStatus } from '@src/modules/copy-helper/types/copy.types';
import { LessonCopyService } from '@src/modules/lesson/service/lesson-copy.service';
import { LessonCopyParentParams } from '@src/modules/lesson/types/lesson-copy-parent.params';

@Injectable()
export class LessonCopyUC {
	constructor(
		private readonly authorisation: AuthorizationService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly lessonRepo: LessonRepo,
		private readonly courseRepo: CourseRepo,
		private readonly copyHelperService: CopyHelperService
	) {}

	async copyLesson(userId: EntityId, lessonId: EntityId, parentParams: LessonCopyParentParams): Promise<CopyStatus> {
		this.featureEnabled();
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalLesson = await this.lessonRepo.findById(lessonId);
		const context = AuthorizationContextBuilder.read([Permission.TOPIC_CREATE]);
		if (!this.authorisation.hasPermission(user, originalLesson, context)) {
			throw new ForbiddenException('could not find lesson to copy');
		}

		const destinationCourse = parentParams.courseId
			? await this.courseRepo.findById(parentParams.courseId)
			: originalLesson.course;
		await this.authorisation.checkPermissionByReferences(
			userId,
			AuthorizableReferenceType.Course,
			destinationCourse.id,
			{
				action: Action.write,
				requiredPermissions: [],
			}
		);

		const [existingLessons] = await this.lessonRepo.findAllByCourseIds([originalLesson.course.id]);
		const existingNames = existingLessons.map((l) => l.name);
		const copyName = this.copyHelperService.deriveCopyName(originalLesson.name, existingNames);

		const copyStatus = await this.lessonCopyService.copyLesson({
			originalLessonId: originalLesson.id,
			destinationCourse,
			user,
			copyName,
		});

		return copyStatus;
	}

	private featureEnabled() {
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
