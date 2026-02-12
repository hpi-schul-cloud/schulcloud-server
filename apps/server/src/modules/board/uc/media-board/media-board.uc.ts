import { AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import type { EntityId } from '@shared/domain/types';
import { BoardNodeRule } from '../..//authorisation/board-node.rule';
import { BoardLayout, MediaBoard, MediaBoardColors, MediaBoardNodeFactory, MediaLine } from '../../domain';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardNodeAuthorizableService, BoardNodeService, MediaBoardService } from '../../service';

@Injectable()
export class MediaBoardUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeRule: BoardNodeRule,
		private readonly boardNodeService: BoardNodeService,
		private readonly mediaBoardNodeFactory: MediaBoardNodeFactory,
		private readonly mediaBoardService: MediaBoardService,
		private readonly configService: ConfigService<MediaBoardConfig, true>
	) {}

	public async getMediaBoardForUser(currentUserId: EntityId): Promise<MediaBoard> {
		this.checkFeatureEnabled();

		const board = await this.mediaBoardService.getOrCreatePersonalMediaBoardOfUser(currentUserId);

		return board;
	}

	public async createLine(userId: EntityId, boardId: EntityId): Promise<MediaLine> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.boardNodeService.findByClassAndId(MediaBoard, boardId);
		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		throwForbiddenIfFalse(this.boardNodeRule.canCreateMediaBoardLine(user, boardNodeAuthorizable));

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

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(board);

		throwForbiddenIfFalse(this.boardNodeRule.canUpdateMediaBoardLayout(user, boardNodeAuthorizable));

		await this.mediaBoardService.updateLayout(board, layout);
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
