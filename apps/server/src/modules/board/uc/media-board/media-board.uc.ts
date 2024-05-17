import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FeatureDisabledLoggableException } from '@shared/common/loggable-exception';
import {
	BoardDoAuthorizable,
	BoardExternalReferenceType,
	type MediaBoard,
	type MediaLine,
} from '@shared/domain/domainobject';
import { User } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import { MediaBoardLayoutType } from '../../domain';
import type { MediaBoardConfig } from '../../media-board.config';
import { BoardDoAuthorizableService, MediaBoardService, MediaLineService } from '../../service';

@Injectable()
export class MediaBoardUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly mediaLineService: MediaLineService,
		private readonly boardDoAuthorizableService: BoardDoAuthorizableService,
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
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(board);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.write([]));

		const line: MediaLine = await this.mediaLineService.create(board);

		return line;
	}

	public async setLayout(userId: EntityId, boardId: EntityId, layout: MediaBoardLayoutType): Promise<void> {
		this.checkFeatureEnabled();

		const board: MediaBoard = await this.mediaBoardService.findById(boardId);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const boardDoAuthorizable: BoardDoAuthorizable = await this.boardDoAuthorizableService.getBoardAuthorizable(board);
		this.authorizationService.checkPermission(user, boardDoAuthorizable, AuthorizationContextBuilder.write([]));

		await this.mediaBoardService.setLayout(board, layout);
	}

	private checkFeatureEnabled(): void {
		if (!this.configService.get('FEATURE_MEDIA_SHELF_ENABLED')) {
			throw new FeatureDisabledLoggableException('FEATURE_MEDIA_SHELF_ENABLED');
		}
	}
}
