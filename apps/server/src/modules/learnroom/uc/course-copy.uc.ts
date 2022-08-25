import { Configuration } from '@hpi-schul-cloud/commons';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
	Actions,
	Board,
	BoardCopyService,
	CopyHelperService,
	CopyStatus,
	Course,
	EntityId,
	LessonCopyService,
	Permission,
} from '@shared/domain';
import { CourseCopyService } from '@shared/domain/service/course-copy.service';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
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
		private readonly copyHelperService: CopyHelperService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly fileCopyAppendService: FileCopyAppendService
	) {}

	async copyCourse(userId: EntityId, courseId: EntityId, jwt: string): Promise<CopyStatus> {
		this.featureEnabled();
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
		await this.courseRepo.save(courseCopy);

		let statusBoard = await this.boardCopyService.copyBoard({ originalBoard, destinationCourse: courseCopy, user });

		if (statusBoard && statusBoard.copyEntity) {
			const boardCopy = statusBoard.copyEntity as Board;
			await this.boardRepo.save(boardCopy);
			statusBoard = this.lessonCopyService.updateCopiedEmbeddedTasks(statusBoard);
			statusBoard = await this.fileCopyAppendService.copyFiles(statusBoard, courseCopy.id, userId, jwt);
			const updatedBoardCopy = statusBoard.copyEntity as Board;
			await this.boardRepo.save(updatedBoardCopy);
		}

		statusCourse.elements ||= [];
		statusCourse.elements.push(statusBoard);
		statusCourse.status = this.copyHelperService.deriveStatusFromElements(statusCourse.elements);
		return statusCourse;
	}

	private featureEnabled() {
		const enabled = Configuration.get('FEATURE_COPY_SERVICE_ENABLED') as boolean;
		if (!enabled) {
			throw new InternalServerErrorException('Copy Feature not enabled');
		}
	}
}
