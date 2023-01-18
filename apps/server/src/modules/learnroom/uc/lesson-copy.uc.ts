import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId, PermissionContextBuilder, User } from '@shared/domain';
import { Permission } from '@shared/domain/interface/permission.enum';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { CopyHelperService, CopyStatus } from '@src/modules/copy-helper';
import { LessonCopyParentParams } from '@src/modules/lesson';
import { LessonCopyService } from '@src/modules/lesson/service';

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
		const context = PermissionContextBuilder.read([Permission.TOPIC_CREATE]);
		if (!this.authorisation.hasPermission(user, originalLesson, context)) {
			throw new ForbiddenException('could not find lesson to copy');
		}

		let destinationCourse = originalLesson.course;
		if (parentParams.courseId) {
			destinationCourse = await this.getDestinationCourse(parentParams.courseId, user);
		}

		const [existingLessons] = await this.lessonRepo.findAllByCourseIds([originalLesson.course.id]);
		const existingNames = existingLessons.map((l) => l.name);
		const copyName = this.copyHelperService.deriveCopyName(originalLesson.name, existingNames);

		const copyStatus = await this.lessonCopyService.copyLesson({
			originalLesson,
			destinationCourse,
			user,
			copyName,
		});

		return copyStatus;
	}

	private async getDestinationCourse(courseId: string, user: User) {
		const destinationCourse = await this.courseRepo.findById(courseId);
		if (!this.authorisation.hasPermission(user, destinationCourse, PermissionContextBuilder.write([]))) {
			throw new ForbiddenException('you dont have permission to add to this course');
		}
		return destinationCourse;
	}

	private featureEnabled() {
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
