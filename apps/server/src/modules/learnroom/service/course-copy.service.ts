import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { ToolContextType } from '@modules/tool/common/enum';
import {
	ContextExternalTool,
	ContextRef,
	CopyContextExternalToolRejectData,
} from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { ToolConfig } from '@modules/tool/tool-config';
import { User } from '@modules/user/repo';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Course } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { CourseRepo } from '@shared/repo/course';
import { UserRepo } from '@shared/repo/user';
import { LegacyBoardRepo } from '../repo';
import { BoardCopyService } from './board-copy.service';
import { CourseRoomsService } from './course-rooms.service';

type CourseCopyParams = {
	originalCourse: Course;
	user: User;
	copyName?: string;
};

@Injectable()
export class CourseCopyService {
	constructor(
		private readonly configService: ConfigService<ToolConfig, true>,
		private readonly courseRepo: CourseRepo,
		private readonly legacyBoardRepo: LegacyBoardRepo,
		private readonly roomsService: CourseRoomsService,
		private readonly boardCopyService: BoardCopyService,
		private readonly copyHelperService: CopyHelperService,
		private readonly userRepo: UserRepo,
		private readonly contextExternalToolService: ContextExternalToolService
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
		let originalBoard = await this.legacyBoardRepo.findByCourseId(courseId);
		originalBoard = await this.roomsService.updateLegacyBoard(originalBoard, courseId, userId);

		// handle potential name conflict
		const [existingCourses] = await this.courseRepo.findAllByUserId(userId);
		const existingNames = existingCourses.map((course: Course) => course.name);
		const copyName = this.copyHelperService.deriveCopyName(newName || originalCourse.name, existingNames);

		// copy course and board
		const courseCopy = await this.copyCourseEntity({ user, originalCourse, copyName });

		let courseToolsCopyStatus: CopyStatus | null = null;
		if (this.configService.get('FEATURE_CTL_TOOLS_COPY_ENABLED')) {
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

	private async copyCourseEntity(params: CourseCopyParams): Promise<Course> {
		const { originalCourse, user, copyName } = params;
		const courseCopy = new Course({
			school: user.school,
			name: copyName,
			color: originalCourse.color,
			teachers: [user],
			startDate: user.school.currentYear?.startDate,
			untilDate: user.school.currentYear?.endDate,
			copyingSince: new Date(),
		});

		await this.courseRepo.createCourse(courseCopy);
		return courseCopy;
	}

	private async finishCourseCopying(courseCopy: Course) {
		delete courseCopy.copyingSince;
		await this.courseRepo.save(courseCopy);
		return courseCopy;
	}

	private deriveCourseStatus(
		originalCourse: Course,
		courseCopy: Course,
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
