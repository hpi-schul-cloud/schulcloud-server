import { LegacyLogger } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { StorageLocation } from '@infra/files-storage-client';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	BoardNodeAuthorizableService,
	ColumnBoardService,
} from '@modules/board';
import { StorageLocationReference } from '@modules/board/service/internal';
import { CopyStatus } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseEntity } from '@modules/course/repo';
import { CourseCopyService } from '@modules/learnroom';
import { LessonCopyService, LessonService } from '@modules/lesson';
import { RoomService } from '@modules/room';
import { RoomMembershipService } from '@modules/room-membership';
import { SchoolService } from '@modules/school';
import { TaskCopyService, TaskService } from '@modules/task';
import { User } from '@modules/user/repo';
import { BadRequestException, Injectable, NotImplementedException } from '@nestjs/common';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
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
		private readonly courseService: CourseService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly roomService: RoomService,
		private readonly roomMembershipService: RoomMembershipService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly schoolService: SchoolService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(ShareTokenUC.name);
	}

	public async createShareToken(
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

	public async lookupShareToken(userId: EntityId, token: string): Promise<ShareTokenInfoDto> {
		this.logger.debug({ action: 'lookupShareToken', userId, token });

		const { shareToken, parentName } = await this.shareTokenService.lookupTokenWithParentName(token);

		this.checkFeatureEnabled(shareToken.payload.parentType);

		await this.checkTokenLookupPermission(userId, shareToken.payload);

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

	public async importShareToken(
		userId: EntityId,
		token: string,
		newName: string,
		destinationId?: EntityId
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
				if (destinationId === undefined) {
					throw new BadRequestException('Cannot copy lesson without destination course reference');
				}
				result = await this.copyLesson(user, shareToken.payload.parentId, destinationId, newName);
				break;
			case ShareTokenParentType.Task:
				if (destinationId === undefined) {
					throw new BadRequestException('Cannot copy task without destination course reference');
				}
				result = await this.copyTask(user, shareToken.payload.parentId, destinationId, newName);
				break;
			case ShareTokenParentType.ColumnBoard:
				if (destinationId === undefined) {
					throw new BadRequestException('Cannot copy board without destination course or room reference');
				}
				result = await this.copyColumnBoard(user, shareToken.payload.parentId, destinationId, newName);
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
		destinationId: EntityId,
		copyTitle?: string
	): Promise<CopyStatus> {
		const originalBoard = await this.columnBoardService.findById(originalColumnBoardId, 0);

		const targetExternalReference: BoardExternalReference = {
			id: destinationId,
			type: originalBoard.context.type,
		};

		await this.checkBoardContextWritePermission(user, targetExternalReference);

		const sourceStorageLocationReference = await this.getStorageLocationReference(originalBoard.context);
		const targetStorageLocationReference = await this.getStorageLocationReference(targetExternalReference);

		const copyStatus = this.columnBoardService.copyColumnBoard({
			originalColumnBoardId,
			targetExternalReference,
			sourceStorageLocationReference,
			targetStorageLocationReference,
			userId: user.id,
			copyTitle,
			targetSchoolId: user.school.id,
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
				await this.checkColumnBoardSharePermission(user, payload.parentId);
				break;
			default:
		}
	}

	private async checkCourseWritePermission(
		user: User,
		courseId: EntityId,
		permission: Permission
	): Promise<{ course: CourseEntity }> {
		const course = await this.courseService.findById(courseId);
		this.authorizationService.checkPermission(user, course, AuthorizationContextBuilder.write([permission]));

		return {
			course,
		};
	}

	private async checkRoomWritePermission(user: User, roomId: EntityId, permissions: Permission[] = []) {
		const roomMembershipAuthorizable = await this.roomMembershipService.getRoomMembershipAuthorizable(roomId);

		this.authorizationService.checkPermission(
			user,
			roomMembershipAuthorizable,
			AuthorizationContextBuilder.write(permissions)
		);
	}

	private async checkLessonWritePermission(user: User, lessonId: EntityId, permission: Permission) {
		const lesson = await this.lessonService.findById(lessonId);
		this.authorizationService.checkPermission(user, lesson, AuthorizationContextBuilder.write([permission]));
	}

	private async checkTaskWritePermission(user: User, taskId: EntityId, permission: Permission) {
		const task = await this.taskService.findById(taskId);
		this.authorizationService.checkPermission(user, task, AuthorizationContextBuilder.write([permission]));
	}

	private async checkColumnBoardSharePermission(user: User, boardNodeId: EntityId) {
		const columBoard = await this.columnBoardService.findById(boardNodeId, 0);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(columBoard);
		const permissions = columBoard.context.type === BoardExternalReferenceType.Course ? [Permission.COURSE_EDIT] : [];

		this.authorizationService.checkPermission(
			user,
			boardNodeAuthorizable,
			AuthorizationContextBuilder.write(permissions)
		);
	}

	private async checkSchoolReadPermission(user: User, schoolId: EntityId): Promise<void> {
		const school = await this.schoolService.getSchoolById(schoolId);
		const authorizationContext = AuthorizationContextBuilder.read([]);

		this.authorizationService.checkPermission(user, school, authorizationContext);
	}

	private async checkContextReadPermission(userId: EntityId, context: ShareTokenContext): Promise<void> {
		const user = await this.authorizationService.getUserWithPermissions(userId);

		if (context.contextType === ShareTokenContextType.School) {
			await this.checkSchoolReadPermission(user, context.contextId);
		} else {
			throw new NotImplementedException();
		}
	}

	private async checkTokenLookupPermission(userId: EntityId, payload: ShareTokenPayload) {
		const user = await this.authorizationService.getUserWithPermissions(userId);
		let requiredPermissions: Permission[] = [];
		// eslint-disable-next-line default-case
		switch (payload.parentType) {
			case ShareTokenParentType.Course:
				requiredPermissions = [Permission.COURSE_CREATE];
				break;
			case ShareTokenParentType.Lesson:
				requiredPermissions = [Permission.TOPIC_CREATE];
				break;
			case ShareTokenParentType.Task:
				requiredPermissions = [Permission.HOMEWORK_CREATE];
				break;
			case ShareTokenParentType.ColumnBoard: {
				const columnBoard = await this.columnBoardService.findById(payload.parentId, 0);
				requiredPermissions =
					columnBoard.context.type === BoardExternalReferenceType.Course ? [Permission.COURSE_EDIT] : [];
				break;
			}
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
					throw new FeatureDisabledLoggableException('FEATURE_COURSE_SHARE');
				}
				break;
			case ShareTokenParentType.Lesson:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_LESSON_SHARE') as boolean)) {
					throw new FeatureDisabledLoggableException('FEATURE_LESSON_SHARE');
				}
				break;
			case ShareTokenParentType.Task:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_TASK_SHARE') as boolean)) {
					throw new FeatureDisabledLoggableException('FEATURE_TASK_SHARE');
				}
				break;
			case ShareTokenParentType.ColumnBoard:
				// Configuration.get is the deprecated way to read envirment variables
				if (!(Configuration.get('FEATURE_COLUMN_BOARD_SHARE') as boolean)) {
					throw new FeatureDisabledLoggableException('FEATURE_COLUMN_BOARD_SHARE');
				}
				break;
			default:
				throw new NotImplementedException('Import Feature not implemented');
		}
	}

	// ---- Move to shared service? (see apps/server/src/modules/board/uc/board.uc.ts)

	private async checkBoardContextWritePermission(user: User, boardContext: BoardExternalReference) {
		if (boardContext.type === BoardExternalReferenceType.Course) {
			await this.checkCourseWritePermission(user, boardContext.id, Permission.COURSE_EDIT);
		} else if (boardContext.type === BoardExternalReferenceType.Room) {
			await this.checkRoomWritePermission(user, boardContext.id);
		} else {
			/* istanbul ignore next */
			throw new Error(`Unsupported board reference type ${boardContext.type as string}`);
		}
	}

	private async getStorageLocationReference(boardContext: BoardExternalReference): Promise<StorageLocationReference> {
		if (boardContext.type === BoardExternalReferenceType.Course) {
			const course = await this.courseService.findById(boardContext.id);

			return { id: course.school.id, type: StorageLocation.SCHOOL };
		}

		if (boardContext.type === BoardExternalReferenceType.Room) {
			const room = await this.roomService.getSingleRoom(boardContext.id);

			return { id: room.schoolId, type: StorageLocation.SCHOOL };
		}
		/* istanbul ignore next */
		throw new Error(`Unsupported board reference type ${boardContext.type as string}`);
	}
}
