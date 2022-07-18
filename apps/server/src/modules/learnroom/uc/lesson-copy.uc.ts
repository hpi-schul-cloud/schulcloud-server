import { ForbiddenException, Injectable } from '@nestjs/common';
import {
	CopyHelperService,
	CopyStatus,
	EntityId,
	Lesson,
	LessonCopyService,
	PermissionContextBuilder,
	User,
} from '@shared/domain';
import { Permission } from '@shared/domain/interface/permission.enum';
import { CourseRepo, LessonRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';

export type LessonCopyParentParams = {
	courseId?: EntityId;
	// courseGroupId?: EntityId;
};

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

		const status = this.lessonCopyService.copyLesson({
			originalLesson,
			destinationCourse,
			user,
			copyName,
		});

		if (status.copyEntity) {
			const lessonCopy = status.copyEntity as Lesson;
			await this.lessonRepo.save(lessonCopy);
		}

		return status;
	}

	private async getDestinationCourse(courseId: string, user: User) {
		const destinationCourse = await this.courseRepo.findById(courseId);
		if (!this.authorisation.hasPermission(user, destinationCourse, PermissionContextBuilder.write([]))) {
			throw new ForbiddenException('you dont have permission to add to this course');
		}
		return destinationCourse;
	}
}
