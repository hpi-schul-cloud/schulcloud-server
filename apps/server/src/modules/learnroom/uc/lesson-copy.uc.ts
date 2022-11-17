import { Configuration } from '@hpi-schul-cloud/commons';
import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CopyHelperService, CopyStatus, EntityId, Lesson, AuthorizationContextBuilder, User } from '@shared/domain';
import { Permission } from '@shared/domain/interface/permission.enum';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { LessonCopyService } from '../service';

export type LessonCopyParentParams = {
	courseId?: EntityId;
	userId: string;
};

@Injectable()
export class LessonCopyUC {
	constructor(
		private readonly authorisation: AuthorizationService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly lessonRepo: LessonRepo,
		private readonly courseRepo: CourseRepo,
		private readonly copyHelperService: CopyHelperService,
		private readonly fileCopyAppendService: FileCopyAppendService
	) {}

	async copyLesson(userId: EntityId, lessonId: EntityId, parentParams: LessonCopyParentParams): Promise<CopyStatus> {
		this.featureEnabled();
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalLesson = await this.lessonRepo.findById(lessonId);
		const context = AuthorizationContextBuilder.read([Permission.TOPIC_CREATE]);
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

		let status = await this.lessonCopyService.copyLesson({
			originalLesson,
			destinationCourse,
			user,
			copyName,
		});

		if (status.copyEntity instanceof Lesson) {
			const lessonCopy = status.copyEntity;
			await this.lessonRepo.save(lessonCopy);
			status = this.lessonCopyService.updateCopiedEmbeddedTasks(status);
			status = await this.fileCopyAppendService.copyFiles(status, lessonCopy.course.id, userId);
			const updatedLesson = status.copyEntity as Lesson;
			await this.lessonRepo.save(updatedLesson);
		}

		return status;
	}

	private async getDestinationCourse(courseId: string, user: User) {
		const destinationCourse = await this.courseRepo.findById(courseId);
		if (!this.authorisation.hasPermission(user, destinationCourse, AuthorizationContextBuilder.write([]))) {
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
