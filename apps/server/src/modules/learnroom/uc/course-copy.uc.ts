import { Injectable } from '@nestjs/common';
import { Actions, CopyStatus, Course, EntityId, Permission } from '@shared/domain';
import { CourseCopyService } from '@shared/domain/service/course-copy.service';
import { BoardRepo, CourseRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';

@Injectable()
export class CourseCopyUC {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly boardRepo: BoardRepo,
		private readonly authorisation: AuthorizationService,
		private readonly courseCopyService: CourseCopyService
	) {}

	async copyCourse(userId: EntityId, courseId: EntityId): Promise<CopyStatus> {
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalCourse = await this.courseRepo.findById(courseId);
		const originalBoard = await this.boardRepo.findByCourseId(originalCourse.id);

		this.authorisation.checkPermission(user, originalCourse, {
			action: Actions.write,
			requiredPermissions: [Permission.COURSE_CREATE],
		});

		const status = this.courseCopyService.copyCourse({
			originalCourse,
			originalBoard,
			user,
		});

		if (status.copyEntity) {
			const course = status.copyEntity as Course;
			await this.courseRepo.save(course);
		}
		return status;
	}
}
