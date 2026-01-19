import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { UserService } from '@modules/user';
import { Inject, Injectable } from '@nestjs/common';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import type { EntityId } from '@shared/domain/types';
import { BOARD_CONFIG_TOKEN, BoardConfig } from '../../board.config';
import {
	BoardExternalReference,
	BoardExternalReferenceType,
	BoardLayout,
	MediaBoard,
	MediaBoardColors,
	MediaBoardNodeFactory,
	MediaLine,
} from '../../domain';
import { BoardNodePermissionService, BoardNodeService, MediaBoardService } from '../../service';

@Injectable()
export class MediaBoardUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly userService: UserService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly mediaBoardNodeFactory: MediaBoardNodeFactory,
		private readonly mediaBoardService: MediaBoardService,
		@Inject(BOARD_CONFIG_TOKEN) private readonly config: BoardConfig
	) {}

	public async getMediaBoardForUser(userId: EntityId): Promise<MediaBoard> {
		this.checkFeatureEnabled();

		const currentUser = await this.authorizationService.getUserWithPermissions(userId);
		const userDo = await this.userService.findById(userId);
		this.authorizationService.checkPermission(currentUser, userDo, AuthorizationContextBuilder.read([]));

		const context: BoardExternalReference = {
			type: BoardExternalReferenceType.User,
			id: currentUser.id,
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

		await this.boardNodePermissionService.checkPermission(userId, board, AuthorizationContextBuilder.write([]));

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

		await this.boardNodePermissionService.checkPermission(userId, board, AuthorizationContextBuilder.write([]));

		await this.mediaBoardService.updateLayout(board, layout);
	}

	private checkFeatureEnabled(): void {
		if (!this.config.featureMediaShelfEnabled) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
