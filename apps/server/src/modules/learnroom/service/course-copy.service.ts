import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool, ContextRef } from '@modules/tool/context-external-tool/domain';
import { ContextExternalToolService } from '@modules/tool/context-external-tool/service';
import { ToolConfig } from '@modules/tool/tool-config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Course, User } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import { CourseRepo, LegacyBoardRepo, UserRepo } from '@shared/repo';
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
		if (this.configService.get('FEATURE_CTL_TOOLS_COPY_ENABLED')) {
			const contextRef: ContextRef = { id: courseId, type: ToolContextType.COURSE };
			const contextExternalToolsInContext: ContextExternalTool[] =
				await this.contextExternalToolService.findAllByContext(contextRef);

			await Promise.all(
				contextExternalToolsInContext.map(async (tool: ContextExternalTool): Promise<ContextExternalTool> => {
					const copiedTool: ContextExternalTool = await this.contextExternalToolService.copyContextExternalTool(
						tool,
						courseCopy.id
					);

					return copiedTool;
				})
			);
		}

		const boardStatus = await this.boardCopyService.copyBoard({ originalBoard, destinationCourse: courseCopy, user });
		const finishedCourseCopy = await this.finishCourseCopying(courseCopy);

		const courseStatus = this.deriveCourseStatus(originalCourse, finishedCourseCopy, boardStatus);

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

		if (this.configService.get('FEATURE_CTL_TOOLS_COPY_ENABLED')) {
			elements.push({
				type: CopyElementType.EXTERNAL_TOOL,
				status: CopyStatusEnum.SUCCESS,
			});
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
}
