import { Injectable } from '@nestjs/common';
import { Board, CopyHelperService, CopyStatus, Course, User, EntityId } from '@shared/domain';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { BoardRepo, CourseRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { BoardCopyService } from './board-copy.service';
import { LessonCopyService } from './lesson-copy.service';
import { RoomsService } from './rooms.service';

export type CourseCopyParams = {
	originalCourse: Course;
	user: User;
	copyName?: string;
};
@Injectable()
export class CourseCopyService {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly boardRepo: BoardRepo,
		private readonly roomsService: RoomsService,
		private readonly boardCopyService: BoardCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly copyHelperService: CopyHelperService,
		private readonly authorizationService: AuthorizationService
	) {}

	async copyCourse({
		userId,
		courseId,
		newName,
	}: {
		userId: EntityId;
		courseId: EntityId;
		newName?: string | undefined;
	}): Promise<CopyStatus> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		// fetch original course, board
		const originalCourse = await this.courseRepo.findById(courseId);
		let originalBoard = await this.boardRepo.findByCourseId(courseId);
		originalBoard = await this.roomsService.updateBoard(originalBoard, courseId, userId);

		// handle potential name conflict
		const [existingCourses] = await this.courseRepo.findAllByUserId(userId);
		const existingNames = existingCourses.map((course: Course) => course.name);

		const copyName = this.copyHelperService.deriveCopyName(newName || originalCourse.name, existingNames);

		const courseCopy = await this.copyCourseEntity({ user, originalCourse, copyName });
		const courseStatus = this.getDefaultCourseStatus(originalCourse, courseCopy);

		let boardStatus = await this.boardCopyService.copyBoard({ originalBoard, destinationCourse: courseCopy, user });

		if (boardStatus && boardStatus.copyEntity) {
			const boardCopy = boardStatus.copyEntity as Board;
			await this.boardRepo.save(boardCopy);
			boardStatus = this.lessonCopyService.updateCopiedEmbeddedTasks(boardStatus);
			await this.boardRepo.save(boardCopy);
			// const { copyStatus } = await this.copyFilesService.copyFilesOfEntity(originalBoard, boardCopy, user.id);
			// boardStatus.elements?.push(copyStatus);
			// boardStatus = await this.fileCopyAppendService.copyFiles(boardStatus, courseCopy.id, userId);
			// const updatedBoardCopy = boardStatus.copyEntity as Board;
			// await this.boardRepo.save(updatedBoardCopy);
		}

		courseStatus.elements ||= [];
		courseStatus.elements.push(boardStatus);
		courseStatus.status = this.copyHelperService.deriveStatusFromElements(courseStatus.elements);

		return courseStatus;
	}

	async copyCourseEntity(params: CourseCopyParams): Promise<Course> {
		const { originalCourse, user, copyName } = params;
		const courseCopy = new Course({
			school: user.school,
			name: copyName ?? originalCourse.name,
			color: originalCourse.color,
			teachers: [user],
			startDate: user.school.schoolYear?.startDate,
			untilDate: user.school.schoolYear?.endDate,
		});
		await this.courseRepo.createCourse(courseCopy);
		return courseCopy;
	}

	getDefaultCourseStatus(originalCourse: Course, courseCopy: Course): CopyStatus {
		const elements = [
			{
				type: CopyElementType.METADATA,
				status: CopyStatusEnum.SUCCESS,
			},
			{
				type: CopyElementType.USER_GROUP,
				status: CopyStatusEnum.NOT_DOING,
			},
			{
				type: CopyElementType.LTITOOL_GROUP,
				status: CopyStatusEnum.NOT_DOING,
			},
			{
				type: CopyElementType.TIME_GROUP,
				status: CopyStatusEnum.NOT_DOING,
			},
		];

		const courseGroupsExist = originalCourse.getCourseGroupItems().length > 0;
		if (courseGroupsExist) {
			elements.push({ type: CopyElementType.COURSEGROUP_GROUP, status: CopyStatusEnum.NOT_IMPLEMENTED });
		}

		const status = {
			title: courseCopy.name,
			type: CopyElementType.COURSE,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: courseCopy,
			originalEntity: originalCourse,
			elements,
		};
		return status;
	}
}
