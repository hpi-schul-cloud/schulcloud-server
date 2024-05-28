import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { BoardDoAuthorizableService, ColumnBoardCopyService, ColumnBoardService } from '@modules/board';
import { CopyStatus } from '@modules/copy-helper';
import { CourseCopyService, CourseService } from '@modules/learnroom';
import { LessonCopyService, LessonService } from '@modules/lesson';
import { TaskCopyService, TaskService } from '@modules/task';
import { BadRequestException, Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { BoardExternalReferenceType } from '@shared/domain/domainobject';
import { Course, User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { SchoolService } from '@src/modules/school';
import {
	ShareTokenContext,
	ShareTokenContextType,
	ShareTokenDO,
	ShareTokenParentType,
	ShareTokenPayload,
} from '../domainobject/share-token.do';
import { ShareTokenService } from '../service';
import { ShareTokenInfoDto } from './dto';

@Injectable()
export class ShareTokenUC {
	constructor(
		private readonly shareTokenService: ShareTokenService,
		private readonly authorizationService: AuthorizationService,
		private readonly courseCopyService: CourseCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly taskCopyService: TaskCopyService,
		private readonly columnBoardCopyService: ColumnBoardCopyService,
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly schoolService: SchoolService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(ShareTokenUC.name);
	}

	async createShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		options?: { schoolExclusive?: boolean; expiresInDays?: number }
	): Promise<ShareTokenDO> {
		this.checkFeatureEnabled(payload.parentType);

		this.logger.debug({ action: 'createShareToken', userId, payload, options });

		const user = await this.authorizationService.getUserWithPermissions(userId);

		await this.checkTokenCreatePermission(user, payload);

		const serviceOptions: { context?: ShareTokenContext; expiresAt?: Date } = {};
		if (options?.schoolExclusive) {
			serviceOptions.context = {
				contextType: ShareTokenContextType.School,
				contextId: user.school.id,
			};
		}
		if (options?.expiresInDays) {
			serviceOptions.expiresAt = this.nowPlusDays(options.expiresInDays);
		}

		const shareToken = await this.shareTokenService.createToken(payload, serviceOptions);
		return shareToken;
	}

	async lookupShareToken(userId: EntityId, token: string): Promise<ShareTokenInfoDto> {
		this.logger.debug({ action: 'lookupShareToken', userId, token });

		const { shareToken, parentName } = await this.shareTokenService.lookupTokenWithParentName(token);

		this.checkFeatureEnabled(shareToken.payload.parentType);

		await this.checkLookupPermission(userId, shareToken.payload.parentType);

		if (shareToken.context) {
			await this.checkContextReadPermission(userId, shareToken.context);
		}

		const shareTokenInfo: ShareTokenInfoDto = {
			token,
			parentType: shareToken.payload.parentType,
			parentName,
		};

		return shareTokenInfo;
	}

	async importShareToken(
		userId: EntityId,
		token: string,
		newName: string,
		destinationCourseId?: string
	): Promise<CopyStatus> {
		this.logger.debug({ action: 'importShareToken', userId, token, newName });

		const shareToken = await this.shareTokenService.lookupToken(token);

		this.checkFeatureEnabled(shareToken.payload.parentType);

		if (shareToken.context) {
			await this.checkContextReadPermission(userId, shareToken.context);
		}

		const user = await this.authorizationService.getUserWithPermissions(userId);

		let result: CopyStatus;
		// eslint-disable-next-line default-case
		switch (shareToken.payload.parentType) {
			case ShareTokenParentType.Course:
				result = await this.copyCourse(user, shareToken.payload.parentId, newName);
				break;
			case ShareTokenParentType.Lesson:
				if (destinationCourseId === undefined) {
					throw new BadRequestException('Destination course id is required to copy lesson');
				}
				result = await this.copyLesson(user, shareToken.payload.parentId, destinationCourseId, newName);
				break;
			case ShareTokenParentType.Task:
				if (destinationCourseId === undefined) {
					throw new BadRequestException('Destination course id is required to copy task');
				}
				result = await this.copyTask(user, shareToken.payload.parentId, destinationCourseId, newName);
				break;
			case ShareTokenParentType.ColumnBoard:
				if (destinationCourseId === undefined) {
					throw new BadRequestException('Destination course id is required to copy task');
				}
				result = await this.copyColumnBoard(user, shareToken.payload.parentId, destinationCourseId, newName);
				break;
		}

		return result;
	}

	private async copyCourse(user: User, courseId: string, newName: string): Promise<CopyStatus> {
		const requiredPermissions = [Permission.COURSE_CREATE];

		this.authorizationService.checkAllPermissions(user, requiredPermissions);

		const copyStatus = await this.courseCopyService.copyCourse({
			userId: user.id,
			courseId,
			newName,
		});

		return copyStatus;
	}

	private async copyLesson(user: User, lessonId: string, courseId: string, copyName?: string): Promise<CopyStatus> {
		const { course } = await this.checkCourseWritePermission(user, courseId, Permission.TOPIC_CREATE);

		const copyStatus = await this.lessonCopyService.copyLesson({
			user,
			originalLessonId: lessonId,
			destinationCourse: course,
			copyName,
		});

		return copyStatus;
	}

	private async copyTask(user: User, originalTaskId: string, courseId: string, copyName?: string): Promise<CopyStatus> {
		const { course } = await this.checkCourseWritePermission(user, courseId, Permission.HOMEWORK_CREATE);

		const copyStatus = await this.taskCopyService.copyTask({
			user,
			originalTaskId,
			destinationCourse: course,
			copyName,
		});

		return copyStatus;
	}

	private async copyColumnBoard(
		user: User,
		originalColumnBoardId: string,
		courseId: string,
		copyTitle?: string
	): Promise<CopyStatus> {
		await this.checkCourseWritePermission(user, courseId, Permission.COURSE_EDIT);

		const copyStatus = this.columnBoardCopyService.copyColumnBoard({
			originalColumnBoardId,
			destinationExternalReference: { type: BoardExternalReferenceType.Course, id: courseId },
			userId: user.id,
			copyTitle,
		});
		return copyStatus;
	}

	private async checkTokenCreatePermission(user: User, payload: ShareTokenPayload) {
		switch (payload.parentType) {
			case ShareTokenParentType.Course:
				await this.checkCourseWritePermission(user, payload.parentId, Permission.COURSE_CREATE);
				break;
			case ShareTokenParentType.Lesson:
				await this.checkLessonWritePermission(user, payload.parentId, Permission.TOPIC_CREATE);
				break;
			case ShareTokenParentType.Task:
				await this.checkTaskWritePermission(user, payload.parentId, Permission.HOMEWORK_CREATE);
				break;
			case ShareTokenParentType.ColumnBoard:
				await this.checkColumnBoardWritePermission(user, payload.parentId, Permission.COURSE_EDIT);
				break;
			default:
		}
	}

	private async checkCourseWritePermission(
		user: User,
		courseId: EntityId,
		permission: Permission
	): Promise<{ course: Course }> {
		const course = await this.courseService.findById(courseId);
		this.authorizationService.checkPermission(user, course, AuthorizationContextBuilder.write([permission]));

		return {
			course,
		};
	}

	private async checkLessonWritePermission(user: User, lessonId: EntityId, permission: Permission) {
		const lesson = await this.lessonService.findById(lessonId);
		this.authorizationService.checkPermission(user, lesson, AuthorizationContextBuilder.write([permission]));
	}

	private async checkTaskWritePermission(user: User, taskId: EntityId, permission: Permission) {
		const task = await this.taskService.findById(taskId);
		this.authorizationService.checkPermission(user, task, AuthorizationContextBuilder.write([permission]));
	}

	private async checkColumnBoardWritePermission(user: User, boardNodeId: EntityId, permission: Permission) {
		const columBoard = await this.columnBoardService.findById(boardNodeId);
		const boardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(columBoard);

		this.authorizationService.checkPermission(
			user,
			boardDoAuthorizable,
			AuthorizationContextBuilder.write([permission])
		);
	}

	private async checkSchoolReadPermission(user: User, schoolId: EntityId) {
		const school = await this.schoolService.getSchoolById(schoolId);
		const authorizationContext = AuthorizationContextBuilder.read([]);

		this.authorizationService.checkPermission(user, school, authorizationContext);
	}

	private async checkContextReadPermission(userId: EntityId, context: ShareTokenContext) {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		if (context.contextType === ShareTokenContextType.School) {
			await this.checkSchoolReadPermission(user, context.contextId);
		} else {
			throw new NotImplementedException();
		}
	}

	private async checkLookupPermission(userId: EntityId, parentType: ShareTokenParentType) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		let requiredPermissions: Permission[] = [];
		// eslint-disable-next-line default-case
		switch (parentType) {
			case ShareTokenParentType.Course:
				requiredPermissions = [Permission.COURSE_CREATE];
				break;
			case ShareTokenParentType.Lesson:
				requiredPermissions = [Permission.TOPIC_CREATE];
				break;
			case ShareTokenParentType.Task:
				requiredPermissions = [Permission.HOMEWORK_CREATE];
				break;
			case ShareTokenParentType.ColumnBoard:
				requiredPermissions = [Permission.COURSE_EDIT];
				break;
		}
		this.authorizationService.checkAllPermissions(user, requiredPermissions);
	}

	private nowPlusDays(days: number) {
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date;
	}

	private checkFeatureEnabled(parentType: ShareTokenParentType) {
		switch (parentType) {
			case ShareTokenParentType.Course:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_COURSE_SHARE') as boolean)) {
					throw new InternalServerErrorException('Import Course Feature not enabled');
				}
				break;
			case ShareTokenParentType.Lesson:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_LESSON_SHARE') as boolean)) {
					throw new InternalServerErrorException('Import Lesson Feature not enabled');
				}
				break;
			case ShareTokenParentType.Task:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_TASK_SHARE') as boolean)) {
					throw new InternalServerErrorException('Import Task Feature not enabled');
				}
				break;
			case ShareTokenParentType.ColumnBoard:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_COLUMN_BOARD_SHARE') as boolean)) {
					throw new InternalServerErrorException('Import Task Feature not enabled');
				}
				break;
			default:
				throw new NotImplementedException('Import Feature not implemented');
		}
	}
}
