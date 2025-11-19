import { LegacyLogger } from '@core/logger';
import { StorageLocation } from '@infra/files-storage-client';
import { AuthorizationService } from '@modules/authorization';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoardService,
	BoardNodeService,
	Column,
} from '@modules/board';
import { StorageLocationReference } from '@modules/board/service/internal';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CourseService } from '@modules/course';
import { CourseCopyService } from '@modules/learnroom';
import { LessonCopyService } from '@modules/lesson';
import { RoomService } from '@modules/room';
import { SagaService } from '@modules/saga';
import { TaskCopyService } from '@modules/task';
import { User } from '@modules/user/repo';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { ShareTokenParentType } from '../domainobject/share-token.do';
import { ShareTokenService } from '../service';
import { ShareTokenPermissionService } from './service';
import { Card } from '../../board/domain';

@Injectable()
export class ImportTokenUC {
	constructor(
		private readonly shareTokenService: ShareTokenService,
		private readonly authorizationService: AuthorizationService,
		private readonly courseCopyService: CourseCopyService,
		private readonly lessonCopyService: LessonCopyService,
		private readonly taskCopyService: TaskCopyService,
		private readonly courseService: CourseService,
		private readonly roomService: RoomService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly boardNodeService: BoardNodeService,
		private readonly sagaService: SagaService,
		private readonly logger: LegacyLogger,
		private readonly shareTokenPermissionService: ShareTokenPermissionService
	) {
		this.logger.setContext(ImportTokenUC.name);
	}

	public async importShareToken(
		userId: EntityId,
		token: string,
		newName: string,
		destinationId?: EntityId
	): Promise<CopyStatus> {
		this.logger.debug({ action: 'importShareToken', userId, token, newName });

		const shareToken = await this.shareTokenService.lookupToken(token);

		this.shareTokenPermissionService.checkFeatureEnabled(shareToken.payload.parentType);

		if (shareToken.context) {
			await this.shareTokenPermissionService.checkContextReadPermission(userId, shareToken.context);
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
			case ShareTokenParentType.Room:
				result = await this.copyRoom(user, shareToken.payload.parentId, newName);
				break;
			case ShareTokenParentType.Card:
				if (destinationId === undefined) {
					throw new BadRequestException('Cannot import card without destination reference');
				}
				result = await this.copyCard(user, shareToken.payload.parentId, destinationId, newName);
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
		const { course } = await this.shareTokenPermissionService.checkCourseWritePermission(
			user,
			courseId,
			Permission.TOPIC_CREATE
		);

		const copyStatus = await this.lessonCopyService.copyLesson({
			user,
			originalLessonId: lessonId,
			destinationCourse: course,
			copyName,
		});

		return copyStatus;
	}

	private async copyTask(user: User, originalTaskId: string, courseId: string, copyName?: string): Promise<CopyStatus> {
		const { course } = await this.shareTokenPermissionService.checkCourseWritePermission(
			user,
			courseId,
			Permission.HOMEWORK_CREATE
		);

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
		originalColumnBoardId: EntityId,
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

		const copyStatus = await this.columnBoardService.copyColumnBoard({
			originalColumnBoardId,
			targetExternalReference,
			sourceStorageLocationReference,
			targetStorageLocationReference,
			userId: user.id,
			copyTitle,
			targetSchoolId: user.school.id,
		});

		await this.columnBoardService.swapLinkedIdsInBoards(copyStatus);

		return copyStatus;
	}

	private async copyRoom(user: User, roomId: EntityId, copyName?: string): Promise<CopyStatus> {
		this.authorizationService.checkOneOfPermissions(user, [Permission.SCHOOL_CREATE_ROOM]);

		const { roomCopied, boardsCopied } = await this.sagaService.executeSaga('roomCopy', {
			userId: user.id,
			roomId,
			newName: copyName,
		});

		const copyStatus: CopyStatus = {
			title: roomCopied.name,
			type: CopyElementType.ROOM,
			status: CopyStatusEnum.SUCCESS,
			copyEntity: {
				id: roomCopied.id,
			},
			elements: boardsCopied.map((boardItem) => {
				return {
					title: boardItem.title,
					type: CopyElementType.BOARD,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: {
						id: boardItem.id,
					},
				};
			}),
		};

		return copyStatus;
	}

	private async copyCard(
		user: User,
		originalCardId: EntityId,
		destinationId: EntityId,
		copyTitle?: string
	): Promise<CopyStatus> {
		const originalCard = await this.boardNodeService.findByClassAndId(Card, originalCardId);
		const originalBoard = await this.columnBoardService.findById(originalCard.rootId, 0);
		// TODO check read permission?

		const destinationColumn = await this.boardNodeService.findByClassAndId(Column, destinationId);
		const destinationBoard = await this.columnBoardService.findById(destinationColumn.rootId, 0);

		const targetExternalReference: BoardExternalReference = {
			id: destinationBoard.context.id,
			type: destinationBoard.context.type,
		};

		await this.checkBoardContextWritePermission(user, targetExternalReference);

		const sourceStorageLocationReference = await this.getStorageLocationReference(originalBoard.context);
		const targetStorageLocationReference = await this.getStorageLocationReference(targetExternalReference);

		const copyStatus = await this.columnBoardService.copyCard({
			originalCardId,
			sourceStorageLocationReference,
			targetStorageLocationReference,
			userId: user.id,
			copyTitle,
			targetSchoolId: targetStorageLocationReference.id,
			destinationColumnId: destinationId,
		});

		return copyStatus;
	}

	private async checkBoardContextWritePermission(user: User, boardContext: BoardExternalReference): Promise<void> {
		if (boardContext.type === BoardExternalReferenceType.Course) {
			await this.shareTokenPermissionService.checkCourseWritePermission(user, boardContext.id, Permission.COURSE_EDIT);
		} else if (boardContext.type === BoardExternalReferenceType.Room) {
			await this.shareTokenPermissionService.checkRoomWritePermission(user, boardContext.id);
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
