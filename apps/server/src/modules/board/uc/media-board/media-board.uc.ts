import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { BoardExternalReferenceType, type MediaBoard, type MediaLine } from '@shared/domain/domainobject';
import type { User as UserEntity } from '@shared/domain/entity';
import type { EntityId } from '@shared/domain/types';
import { MediaBoardService, MediaLineService } from '../../service';

@Injectable()
export class MediaBoardUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly mediaBoardService: MediaBoardService,
		private readonly mediaLineService: MediaLineService
	) {}

	public async getMediaBoardForUser(userId: EntityId): Promise<MediaBoard> {
		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
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
		const user: UserEntity = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkPermission(user, user, AuthorizationContextBuilder.read([]));

		const board: MediaBoard = await this.mediaBoardService.findById(boardId);

		const line: MediaLine = await this.mediaLineService.create(board);

		return line;
	}
}
