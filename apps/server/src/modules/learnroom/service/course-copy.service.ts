import { Injectable } from '@nestjs/common';
import { Board, CopyHelperService, CopyStatus, Course, EntityId } from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { BoardRepo, CourseRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { BoardCopyService } from './board-copy.service';
import { CourseEntityCopyService } from './course-entity-copy.service';
import { LessonCopyService } from './lesson-copy.service';
import { RoomsService } from './rooms.service';

@Injectable()
export class CourseCopyService {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly boardRepo: BoardRepo,
		private readonly roomsService: RoomsService,
		private readonly courseEntityCopyService: CourseEntityCopyService,
		private readonly boardCopyService: BoardCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly fileCopyAppendService: FileCopyAppendService,
		private readonly copyHelperService: CopyHelperService,
		private readonly authorizationService: AuthorizationService
	) {}

	async copyCourse({
		userId,
		courseId,
		newName,
		jwt,
	}: {
		userId: EntityId;
		courseId: EntityId;
		newName?: string;
		jwt: string;
	}): Promise<CopyStatus> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		// fetch original course, board
		const originalCourse = await this.courseRepo.findById(courseId);
		let originalBoard = await this.boardRepo.findByCourseId(courseId);
		originalBoard = await this.roomsService.updateBoard(originalBoard, courseId, userId);

		// handle potential name conflict
		const [existingCourses] = await this.courseRepo.findAllByUserId(userId);
		const existingNames = existingCourses.map((course: Course) => course.name);

		const copyName = this.copyHelperService.deriveCopyName(newName ?? originalCourse.name, existingNames);

		const statusCourse = this.courseEntityCopyService.copyCourse({ user, originalCourse, copyName });
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
}
