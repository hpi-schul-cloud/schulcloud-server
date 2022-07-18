import { Injectable } from '@nestjs/common';
import {
	Actions,
	Board,
	BoardCopyService,
	CopyHelperService,
	CopyStatus,
	Course,
	EntityId,
	Permission,
} from '@shared/domain';
import { CourseCopyService } from '@shared/domain/service/course-copy.service';
import { BoardRepo, CourseRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
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
		private readonly copyHelperService: CopyHelperService
	) {}

	async copyCourse(userId: EntityId, courseId: EntityId): Promise<CopyStatus> {
		const user = await this.authorisation.getUserWithPermissions(userId);
		const originalCourse = await this.courseRepo.findById(courseId);
		let originalBoard = await this.boardRepo.findByCourseId(courseId);
		originalBoard = await this.roomsService.updateBoard(originalBoard, courseId, userId);

		this.authorisation.checkPermission(user, originalCourse, {
			action: Actions.write,
			requiredPermissions: [Permission.COURSE_CREATE],
		});

		const [existingCourses] = await this.courseRepo.findAllByUserId(userId);
		const existingNames = existingCourses.map((course: Course) => course.name);

		const copyName = this.copyHelperService.deriveCopyName(originalCourse.name, existingNames);

		const statusCourse = this.courseCopyService.copyCourse({ originalCourse, user, copyName });
		const courseCopy = statusCourse.copyEntity as Course;

		const statusBoard = this.boardCopyService.copyBoard({ originalBoard, destinationCourse: courseCopy, user });
		const boardCopy = statusBoard.copyEntity as Board;

		await this.courseRepo.save(courseCopy);
		await this.boardRepo.save(boardCopy);

		statusCourse.elements ||= [];
		statusCourse.elements.push(statusBoard);

		return statusCourse;
	}
}
