import { Injectable } from '@nestjs/common';
import { Course, EntityId, User } from '@shared/domain';
import { BoardRepo, CourseRepo, UserRepo } from '@shared/repo';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@src/modules/copy-helper';
import { CourseCreateDto } from '../types';
import { BoardCopyService } from './board-copy.service';
import { RoomsService } from './rooms.service';

type CourseCopyParams = {
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
		private readonly userRepo: UserRepo
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
		const user: User = await this.userRepo.findById(userId, true);

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
		const finishedCourseCopy = await this.finishCourseCopying(courseCopy);

		const courseStatus = this.deriveCourseStatus(originalCourse, finishedCourseCopy, boardStatus);

		return courseStatus;
	}

	private async copyCourseEntity(params: CourseCopyParams): Promise<Course> {
		const { originalCourse, user, copyName } = params;
		const courseCreateDto: CourseCreateDto = {
			schoolId: user.school.id,
			name: copyName ?? '',
			color: originalCourse.color,
			teacherIds: [user.id],
			startDate: user.school.schoolYear?.startDate,
			untilDate: user.school.schoolYear?.endDate,
			copyingSince: new Date(),
		};

		const courseCopy = await this.courseRepo.createCourse(courseCreateDto);
		return courseCopy;
	}

	private async finishCourseCopying(courseCopy: Course) {
		delete courseCopy.copyingSince;
		await this.courseRepo.save(courseCopy);
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
