import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { ToolContextType } from '@modules/tool/common/enum';
import {
	ContextExternalTool,
	ContextRef,
	CopyContextExternalToolRejectData,
} from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { Inject, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LEARNROOM_CONFIG_TOKEN, LearnroomConfig } from '../learnroom.config';
import { LegacyBoardRepo } from '../repo';
import { CourseRoomsService } from './course-rooms.service';
import { LegacyBoardCopyService } from './legacy-board-copy.service';

type CourseCopyParams = {
	originalCourse: CourseEntity;
	user: User;
	copyName?: string;
};

@Injectable()
export class CourseCopyService {
	constructor(
		private readonly courseService: CourseService,
		private readonly legacyBoardRepo: LegacyBoardRepo,
		private readonly roomsService: CourseRoomsService,
		private readonly boardCopyService: LegacyBoardCopyService,
		private readonly copyHelperService: CopyHelperService,
		private readonly userService: UserService,
		private readonly contextExternalToolService: ContextExternalToolService,
		@Inject(LEARNROOM_CONFIG_TOKEN)
		private readonly learnroomConfig: LearnroomConfig
	) {}

	public async copyCourse({
		userId,
		courseId,
		newName,
	}: {
		userId: EntityId;
		courseId: EntityId;
		newName?: string | undefined;
	}): Promise<CopyStatus> {
		const user: User = await this.userService.getUserEntityWithRoles(userId);

		// fetch original course and board
		const originalCourse = await this.courseService.findById(courseId);
		let originalBoard = await this.legacyBoardRepo.findByCourseId(courseId);
		originalBoard = await this.roomsService.updateLegacyBoard(originalBoard, courseId, userId);

		// handle potential name conflict
		const [existingCourses] = await this.courseService.findAllByUserId(userId, user.school.id);
		const existingNames = existingCourses.map((course: CourseEntity) => course.name);
		const copyName = this.copyHelperService.deriveCopyName(newName || originalCourse.name, existingNames);

		// copy course and board
		const courseCopy = await this.copyCourseEntity({ user, originalCourse, copyName });

		let courseToolsCopyStatus: CopyStatus | null = null;
		if (this.learnroomConfig.featureCtlToolsCopyEnabled) {
			const contextRef: ContextRef = { id: courseId, type: ToolContextType.COURSE };
			const contextExternalToolsInContext: ContextExternalTool[] =
				await this.contextExternalToolService.findAllByContext(contextRef);

			const copyCourseToolsResult = await Promise.all(
				contextExternalToolsInContext.map(
					async (tool: ContextExternalTool): Promise<ContextExternalTool | CopyContextExternalToolRejectData> => {
						const copiedResult: ContextExternalTool | CopyContextExternalToolRejectData =
							await this.contextExternalToolService.copyContextExternalTool(tool, courseCopy.id, user.school.id);

						return copiedResult;
					}
				)
			);

			courseToolsCopyStatus = this.deriveCourseToolCopyStatus(copyCourseToolsResult);
		}

		const boardStatus = await this.boardCopyService.copyBoard({
			originalBoard,
			originalCourse,
			destinationCourse: courseCopy,
			user,
		});
		const finishedCourseCopy = await this.finishCourseCopying(courseCopy);

		const courseStatus = this.deriveCourseStatus(
			originalCourse,
			finishedCourseCopy,
			boardStatus,
			courseToolsCopyStatus
		);

		return courseStatus;
	}

	private async copyCourseEntity(params: CourseCopyParams): Promise<CourseEntity> {
		const { originalCourse, user, copyName } = params;
		const courseCopy = new CourseEntity({
			school: user.school,
			name: copyName,
			color: originalCourse.color,
			teachers: [user],
			startDate: user.school.currentYear?.startDate,
			untilDate: user.school.currentYear?.endDate,
			copyingSince: new Date(),
		});

		await this.courseService.create(courseCopy);

		return courseCopy;
	}

	private async finishCourseCopying(courseCopy: CourseEntity): Promise<CourseEntity> {
		delete courseCopy.copyingSince;
		await this.courseService.save(courseCopy);

		return courseCopy;
	}

	private deriveCourseStatus(
		originalCourse: CourseEntity,
		courseCopy: CourseEntity,
		boardStatus: CopyStatus,
		courseToolsCopyStatus: CopyStatus | null
	): CopyStatus {
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
				type: CopyElementType.TIME_GROUP,
				status: CopyStatusEnum.NOT_DOING,
			},
			boardStatus,
		];

		if (courseToolsCopyStatus) {
			elements.push(courseToolsCopyStatus);
		}

		const courseGroupsExist = originalCourse.getCourseGroupItems().length > 0;
		if (courseGroupsExist) {
			elements.push({
				type: CopyElementType.COURSEGROUP_GROUP,
				status: CopyStatusEnum.NOT_IMPLEMENTED,
			});
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

	private deriveCourseToolCopyStatus(
		copyCourseToolsResult: (ContextExternalTool | CopyContextExternalToolRejectData)[]
	): CopyStatus | null {
		if (!copyCourseToolsResult.length) {
			return null;
		}

		const rejectedCopies: CopyContextExternalToolRejectData[] = copyCourseToolsResult.filter(
			(result) => result instanceof CopyContextExternalToolRejectData
		);

		let status: CopyStatusEnum;
		if (rejectedCopies.length === copyCourseToolsResult.length) {
			status = CopyStatusEnum.FAIL;
		} else if (rejectedCopies.length > 0) {
			status = CopyStatusEnum.PARTIAL;
		} else {
			status = CopyStatusEnum.SUCCESS;
		}

		return {
			type: CopyElementType.EXTERNAL_TOOL,
			status,
		};
	}
}
