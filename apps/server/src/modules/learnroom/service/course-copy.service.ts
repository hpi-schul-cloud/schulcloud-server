import { Injectable } from '@nestjs/common';
import {
	Board,
	CopyElementType,
	CopyHelperService,
	CopyStatus,
	CopyStatusEnum,
	Course,
	EntityId,
	User,
} from '@shared/domain';
import { FileCopyAppendService } from '@shared/domain/service/file-copy-append.service';
import { BoardRepo, CourseRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { RoomsService } from '../uc/rooms.service';
import { BoardCopyService } from './board-copy.service';
import { LessonCopyService } from './lesson-copy.service';

@Injectable()
export class CourseCopyService {
	constructor(
		private readonly courseRepo: CourseRepo,
		private readonly boardRepo: BoardRepo,
		private readonly roomsService: RoomsService,
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

		const statusCourse = this.copyCourseEntity(user, originalCourse, copyName);
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

	private copyCourseEntity(user: User, originalCourse: Course, copyName?: string | undefined): CopyStatus {
		const copy = new Course({
			school: user.school,
			name: copyName ?? originalCourse.name,
			color: originalCourse.color,
			teachers: [user],
			startDate: user.school.schoolYear?.startDate,
			untilDate: user.school.schoolYear?.endDate,
		});

		const elements = [
			{
				// WIP check types under @shred/domain
				type: CopyElementType.METADATA,
				status: CopyStatusEnum.SUCCESS,
			},
			{
				type: CopyElementType.USER_GROUP, // teachers, substitutionTeachers, students,...
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
			title: copy.name,
			type: CopyElementType.COURSE,
			status: this.copyHelperService.deriveStatusFromElements(elements),
			copyEntity: copy,
			originalEntity: originalCourse,
			elements,
		};

		return status;
	}
}
