import { Injectable } from '@nestjs/common';
import { CopyHelperService, CopyStatus, Course, User, EntityId } from '@shared/domain';
import { CopyElementType, CopyStatusEnum } from '@shared/domain/types';
import { BoardRepo, CourseRepo } from '@shared/repo';
import { AuthorizationService } from '@src/modules/authorization';
import { BoardCopyService } from './board-copy.service';
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

		// fetch original course and board
		const originalCourse = await this.courseRepo.findById(courseId);
		let originalBoard = await this.boardRepo.findByCourseId(courseId);
		originalBoard = await this.roomsService.updateBoard(originalBoard, courseId, userId);

		// handle potential name conflict
		const [existingCourses] = await this.courseRepo.findAllByUserId(userId);
		const existingNames = existingCourses.map((course: Course) => course.name);
		const copyName = this.copyHelperService.deriveCopyName(newName || originalCourse.name, existingNames);

		// copy course and board
		const courseCopy = await this.copyCourseEntity({ user, originalCourse, copyName });
		const boardStatus = await this.boardCopyService.copyBoard({ originalBoard, destinationCourse: courseCopy, user });
		const courseStatus = this.deriveCourseStatus(originalCourse, courseCopy, boardStatus);

		return courseStatus;
	}

	private async copyCourseEntity(params: CourseCopyParams): Promise<Course> {
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

	private deriveCourseStatus(originalCourse: Course, courseCopy: Course, boardStatus: CopyStatus): CopyStatus {
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
			boardStatus,
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
