import { Injectable } from '@nestjs/common';
import { Actions, CopyStatus, EntityId, Permission } from '@shared/domain';
import { CourseCopyService } from '@shared/domain/service/course-copy.service';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { BoardRepo, CourseRepo } from '../../../shared/repo';

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

		const { copy, status } = this.courseCopyService.copyCourse({
			originalCourse,
			originalBoard,
			user,
		});
		await this.courseRepo.save(copy);

		return status;
	}
}
