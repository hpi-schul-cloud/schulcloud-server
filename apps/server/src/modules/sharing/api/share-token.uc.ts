import { LegacyLogger } from '@core/logger';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { BoardExternalReferenceType, BoardNodeAuthorizableService, ColumnBoardService } from '@modules/board';
import { LessonService } from '@modules/lesson';
import { TaskService } from '@modules/task';
import { User } from '@modules/user/repo';
import { Injectable, NotImplementedException } from '@nestjs/common';
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
import { ShareTokenPermissionService } from './service';

@Injectable()
export class ShareTokenUC {
	constructor(
		private readonly shareTokenService: ShareTokenService,
		private readonly authorizationService: AuthorizationService,
		private readonly lessonService: LessonService,
		private readonly taskService: TaskService,
		private readonly columnBoardService: ColumnBoardService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly logger: LegacyLogger,
		private readonly shareTokenPermissionService: ShareTokenPermissionService
	) {
		this.logger.setContext(ShareTokenUC.name);
	}

	public async createShareToken(
		userId: EntityId,
		payload: ShareTokenPayload,
		options?: { schoolExclusive?: boolean; expiresInDays?: number }
	): Promise<ShareTokenDO> {
		this.shareTokenPermissionService.checkFeatureEnabled(payload.parentType);

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

		this.shareTokenPermissionService.checkFeatureEnabled(shareToken.payload.parentType);

		await this.checkTokenLookupPermission(userId, shareToken.payload);

		if (shareToken.context) {
			await this.shareTokenPermissionService.checkContextReadPermission(userId, shareToken.context);
		}

		const shareTokenInfo: ShareTokenInfoDto = {
			token,
			parentType: shareToken.payload.parentType,
			parentName,
		};

		return shareTokenInfo;
	}

	private async checkTokenCreatePermission(user: User, payload: ShareTokenPayload): Promise<void> {
		switch (payload.parentType) {
			case ShareTokenParentType.Course:
				await this.shareTokenPermissionService.checkCourseWritePermission(
					user,
					payload.parentId,
					Permission.COURSE_CREATE
				);
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
			case ShareTokenParentType.Room:
				await this.shareTokenPermissionService.checkRoomWritePermission(user, payload.parentId, [
					Permission.ROOM_SHARE_ROOM,
				]);
				break;
			case ShareTokenParentType.Card:
				await this.shareTokenPermissionService.checkRoomWritePermission(user, payload.parentId, [
					Permission.ROOM_SHARE_ROOM,
				]);
				break;
			default:
				throw new NotImplementedException('Share Feature not implemented');
		}
	}

	private async checkLessonWritePermission(user: User, lessonId: EntityId, permission: Permission): Promise<void> {
		const lesson = await this.lessonService.findById(lessonId);
		this.authorizationService.checkPermission(user, lesson, AuthorizationContextBuilder.write([permission]));
	}

	private async checkTaskWritePermission(user: User, taskId: EntityId, permission: Permission): Promise<void> {
		const task = await this.taskService.findById(taskId);
		this.authorizationService.checkPermission(user, task, AuthorizationContextBuilder.write([permission]));
	}

	private async checkColumnBoardSharePermission(user: User, boardNodeId: EntityId): Promise<void> {
		const columBoard = await this.columnBoardService.findById(boardNodeId, 0);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(columBoard);
		const permissions = columBoard.context.type === BoardExternalReferenceType.Course ? [Permission.COURSE_EDIT] : [];

		this.authorizationService.checkPermission(
			user,
			boardNodeAuthorizable,
			AuthorizationContextBuilder.write(permissions)
		);
	}

	private async checkTokenLookupPermission(userId: EntityId, payload: ShareTokenPayload): Promise<void> {
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
			case ShareTokenParentType.Room: {
				requiredPermissions = [Permission.SCHOOL_CREATE_ROOM];
				break;
			}
			case ShareTokenParentType.Card: {
				const columnBoard = await this.columnBoardService.findById(payload.parentId, 0);
				requiredPermissions =
					columnBoard.context.type === BoardExternalReferenceType.Course ? [Permission.COURSE_EDIT] : [];
				break;
			}
		}
		this.authorizationService.checkAllPermissions(user, requiredPermissions);
	}

	private nowPlusDays(days: number): Date {
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date;
	}
}
