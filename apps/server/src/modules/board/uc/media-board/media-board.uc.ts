import { Action, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { User } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	MediaBoard,
	MediaBoardNodeFactory,
	MediaLine,
	BoardLayout,
} from '../../domain';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardNodePermissionService, BoardNodeService, MediaBoardService } from '../../service';
import { MediaBoardColors } from '../../domain/media-board/types';

@Injectable()
export class MediaBoardUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly mediaBoardNodeFactory: MediaBoardNodeFactory,
		private readonly mediaBoardService: MediaBoardService,
		private readonly configService: ConfigService<MediaBoardConfig, true>
	) {}

	public async getMediaBoardForUser(userId: EntityId): Promise<MediaBoard> {
		this.checkFeatureEnabled();

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, user, AuthorizationContextBuilder.read([]));

		const context: BoardExternalReference = {
			type: BoardExternalReferenceType.User,
			id: user.id,
		};

		const existingBoards: MediaBoard[] = await this.mediaBoardService.findByExternalReference(context);

		let board: MediaBoard;
		if (!existingBoards.length) {
			board = this.mediaBoardNodeFactory.buildMediaBoard({
				context,
				layout: BoardLayout.LIST,
				backgroundColor: MediaBoardColors.TRANSPARENT,
				collapsed: false,
			});
			await this.boardNodeService.addRoot(board);
		} else {
			board = existingBoards[0];
		}

		return board;
	}

	public async createLine(userId: EntityId, boardId: EntityId): Promise<MediaLine> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, boardId);

		await this.boardNodePermissionService.checkPermission(userId, board, Action.write);

		const line = this.mediaBoardNodeFactory.buildMediaLine({
			title: '',
			backgroundColor: MediaBoardColors.TRANSPARENT,
			collapsed: false,
		});
		await this.boardNodeService.addToParent(board, line);

		return line;
	}

	public async setLayout(userId: EntityId, boardId: EntityId, layout: BoardLayout): Promise<void> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, boardId);

		await this.boardNodePermissionService.checkPermission(userId, board, Action.write);

		await this.mediaBoardService.updateLayout(board, layout);
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
