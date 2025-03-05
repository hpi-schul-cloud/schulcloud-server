import { Configuration } from '@hpi-schul-cloud/commons';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { CopyHelperService, CopyStatus } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { LessonCopyParentParams, LessonCopyService, LessonService } from '@modules/lesson';
import { User } from '@modules/user/repo';
import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { LessonEntity } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class LessonCopyUC {
	constructor(
		private readonly authorisation: AuthorizationService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly lessonService: LessonService,
		private readonly courseService: CourseService,
		private readonly copyHelperService: CopyHelperService
	) {}

	public async copyLesson(
		userId: EntityId,
		lessonId: EntityId,
		parentParams: LessonCopyParentParams
	): Promise<CopyStatus> {
		this.checkFeatureEnabled();

		const [user, originalLesson]: [User, LessonEntity] = await Promise.all([
			this.authorisation.getUserWithPermissions(userId),
			this.lessonService.findById(lessonId),
		]);

		this.checkOriginalLessonAuthorization(user, originalLesson);

		// should be a seperate private method
		const destinationCourse = parentParams.courseId
			? await this.courseService.findById(parentParams.courseId)
			: originalLesson.course;
		// ---

		this.checkDestinationCourseAuthorization(user, destinationCourse);

		// should be a seperate private method
		const [existingLessons] = await this.lessonService.findByCourseIds([originalLesson.course.id]);
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

	private checkOriginalLessonAuthorization(user: User, originalLesson: LessonEntity): void {
		const contextReadWithTopicCreate = AuthorizationContextBuilder.read([Permission.TOPIC_CREATE]);
		if (!this.authorisation.hasPermission(user, originalLesson, contextReadWithTopicCreate)) {
			// error message is not correct, switch to authorisation.checkPermission() makse sense for me
			throw new ForbiddenException('could not find lesson to copy');
		}
	}

	private checkDestinationCourseAuthorization(user: User, destinationCourse: CourseEntity): void {
		const contextCanWrite = AuthorizationContextBuilder.write([]);
		this.authorisation.checkPermission(user, destinationCourse, contextCanWrite);
	}

	private checkFeatureEnabled() {
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
