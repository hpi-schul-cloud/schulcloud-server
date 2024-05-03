import { Action, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import { BoardExternalReferenceType, type MediaBoard, type MediaLine } from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import type { MediaBoardConfig } from '../../media-board.config';
import { MediaBoardService, MediaLineService } from '../../service';
import { BoardNodePermissionService } from '../../poc/service';

@Injectable()
export class MediaBoardUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly mediaLineService: MediaLineService,
		private readonly boardNodePermissionService: BoardNodePermissionService,
		private readonly configService: ConfigService<MediaBoardConfig, true>
	) {}

	public async getMediaBoardForUser(userId: EntityId): Promise<MediaBoard> {
		this.checkFeatureEnabled();

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, user, AuthorizationContextBuilder.read([]));

		const boardIds: EntityId[] = await this.mediaBoardService.findIdsByExternalReference({
			type: BoardExternalReferenceType.User,
			id: user.id,
		});

		let board: MediaBoard;
		if (!boardIds.length) {
			board = await this.mediaBoardService.create({
				type: BoardExternalReferenceType.User,
				id: user.id,
			});
		} else {
			board = await this.mediaBoardService.findById(boardIds[0]);
		}

		return board;
	}

	public async createLine(userId: EntityId, boardId: EntityId): Promise<MediaLine> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.mediaBoardService.findById(boardId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);

		await this.boardNodePermissionService.checkPermission(user.id, board, Action.write);

		const line: MediaLine = await this.mediaLineService.create(board);

		return line;
	}

	private checkFeatureEnabled() {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
