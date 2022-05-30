import { ForbiddenException, Injectable } from '@nestjs/common';
import { Actions, CopyStatusDTO, EntityId, Permission } from '@shared/domain';
import { CourseCopyService } from '@shared/domain/service/course-copy.service';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { CourseRepo } from '../../../shared/repo';

@Injectable()
export class CourseCopyUC {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly authorisation: AuthorizationService,
		private readonly courseCopyService: CourseCopyService
	) {}

	async copyCourse(userId: EntityId, courseId: EntityId): Promise<CopyStatusDTO> {
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalCourse = await this.courseRepo.findById(courseId);
		if (
			!this.authorisation.hasPermission(user, originalCourse, {
				action: Actions.write,
				requiredPermissions: [Permission.COURSE_CREATE],
			})
		) {
			throw new ForbiddenException();
		}
		const { copy, status } = this.courseCopyService.copyCourseMetadata({
			originalCourse,
			user,
		});
		await this.courseRepo.save(copy);
		return status;
	}
}
