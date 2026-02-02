import { AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { throwForbiddenIfFalse } from '@shared/common/utils';
import type { EntityId } from '@shared/domain/types';
import { BoardNodeRule } from '../../authorisation/board-node.rule';
import { MediaBoard, MediaLine } from '../../domain';
import { MediaBoardColors } from '../../domain/media-board/types';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardNodeAuthorizableService, BoardNodeService } from '../../service';
import { MediaBoardService } from '../../service/media-board';

@Injectable()
export class MediaLineUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeAuthorizableService: BoardNodeAuthorizableService,
		private readonly boardNodeRule: BoardNodeRule,
		private readonly configService: ConfigService<MediaBoardConfig, true>,
		private readonly mediaBoardService: MediaBoardService
	) {}

	public async moveLine(
		userId: EntityId,
		lineId: EntityId,
		targetBoardId: EntityId,
		targetPosition: number
	): Promise<void> {
		this.checkFeatureEnabled();

		const line = await this.boardNodeService.findByClassAndId(MediaLine, lineId);
		const targetBoard = await this.boardNodeService.findByClassAndId(MediaBoard, targetBoardId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(targetBoard);
		throwForbiddenIfFalse(this.boardNodeRule.canCreateMediaBoardLine(user, boardNodeAuthorizable));

		await this.boardNodeService.move(line, targetBoard, targetPosition);
	}

	public async updateLineTitle(userId: EntityId, lineId: EntityId, title: string): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(line);
		throwForbiddenIfFalse(this.boardNodeRule.canUpdateMediaBoardLine(user, boardNodeAuthorizable));

		await this.boardNodeService.updateTitle(line, title);
	}

	public async updateLineColor(userId: EntityId, lineId: EntityId, color: MediaBoardColors): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(line);
		throwForbiddenIfFalse(this.boardNodeRule.canUpdateMediaBoardLine(user, boardNodeAuthorizable));

		await this.mediaBoardService.updateBackgroundColor(line, color);
	}

	public async collapseLine(userId: EntityId, lineId: EntityId, collapsed: boolean): Promise<void> {
		this.checkFeatureEnabled();

		const line: MediaLine = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(line);
		throwForbiddenIfFalse(this.boardNodeRule.canUpdateMediaBoardLine(user, boardNodeAuthorizable));

		await this.mediaBoardService.updateCollapsed(line, collapsed);
	}

	public async deleteLine(userId: EntityId, lineId: EntityId): Promise<void> {
		this.checkFeatureEnabled();

		const line = await this.boardNodeService.findByClassAndId(MediaLine, lineId);

		const user = await this.authorizationService.getUserWithPermissions(userId);
		const boardNodeAuthorizable = await this.boardNodeAuthorizableService.getBoardAuthorizable(line);
		throwForbiddenIfFalse(this.boardNodeRule.canDeleteMediaBoardLine(user, boardNodeAuthorizable));

		await this.boardNodeService.delete(line);
	}

	private checkFeatureEnabled() {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
