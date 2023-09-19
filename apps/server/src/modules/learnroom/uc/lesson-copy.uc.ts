import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Course, EntityId, Lesson, User } from '@shared/domain';
import { Permission } from '@shared/domain/interface/permission.enum';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
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

		const [user, originalLesson]: [User, Lesson] = await Promise.all([
			this.authorisation.getUserWithPermissions(userId),
			this.lessonRepo.findById(lessonId),
		]);

		this.hasTopicCreateAndCanReadLesson(user, originalLesson);

		// should be a seperate private method
		const destinationCourse = parentParams.courseId
			? await this.courseRepo.findById(parentParams.courseId)
			: originalLesson.course;
		// ---

		this.canWriteInDestinationCourse(user, destinationCourse);

		// should be a seperate private method
		const [existingLessons] = await this.lessonRepo.findAllByCourseIds([originalLesson.course.id]);
		const existingNames = existingLessons.map((l) => l.name);
		const copyName = this.copyHelperService.deriveCopyName(originalLesson.name, existingNames);

		const copyStatus = await this.lessonCopyService.copyLesson({
			originalLessonId: originalLesson.id,
			destinationCourse,
			user,
			copyName,
		});
		// ---

		return copyStatus;
	}

	private hasTopicCreateAndCanReadLesson(user: User, originalLesson: Lesson): void {
		const contextReadWithTopicCreate = AuthorizationContextBuilder.read([Permission.TOPIC_CREATE]);
		if (!this.authorisation.hasPermission(user, originalLesson, contextReadWithTopicCreate)) {
			// error message is not correct, switch to authorisation.checkPermission() makse sense for me
			throw new ForbiddenException('could not find lesson to copy');
		}
	}

	private canWriteInDestinationCourse(user: User, destinationCourse: Course): void {
		const contextCanWrite = AuthorizationContextBuilder.write([]);
		this.authorisation.checkPermission(user, destinationCourse, contextCanWrite);
	}

	private featureEnabled() {
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
