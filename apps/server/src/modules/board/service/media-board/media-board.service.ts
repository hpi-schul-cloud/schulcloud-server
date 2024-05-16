import { ObjectId } from '@mikro-orm/mongodb';
import type { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { AnyBoardDo, BoardExternalReference, ColumnBoard, MediaBoard } from '@shared/domain/domainobject';
import type { EntityId } from '@shared/domain/types';
import { MediaBoardLayoutType } from '../../controller/media-board/types/layout-type.enum';
import { MediaBoardColors } from '../../controller/media-board/types/media-colors.enum';
import { BoardNotInstanceOfMediaBoardLoggableException } from '../../loggable';
import { BoardDoRepo } from '../../repo';
import { BoardDoService } from '../board-do.service';

@Injectable()
export class MediaBoardService implements AuthorizationLoaderServiceGeneric<MediaBoard> {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	public async findById(boardId: EntityId): Promise<MediaBoard> {
		const board: MediaBoard = await this.boardDoRepo.findByClassAndId(MediaBoard, boardId);

		return board;
	}

	public async findIdsByExternalReference(reference: BoardExternalReference): Promise<EntityId[]> {
		const ids: EntityId[] = await this.boardDoRepo.findIdsByExternalReference(reference);

		return ids;
	}

	public async findByDescendant(descendant: AnyBoardDo): Promise<MediaBoard> {
		const mediaBoard: MediaBoard | ColumnBoard = await this.boardDoService.getRootBoardDo(descendant);
		if (mediaBoard instanceof MediaBoard) {
			return mediaBoard;
		}

		throw new BoardNotInstanceOfMediaBoardLoggableException(mediaBoard.id);
	}

	public async create(context: BoardExternalReference): Promise<MediaBoard> {
		const mediaBoard: MediaBoard = new MediaBoard({
			id: new ObjectId().toHexString(),
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context,
			layout: MediaBoardLayoutType.LIST,
			mediaAvailableLineBackgroundColor: MediaBoardColors.TRANSPARENT,
			mediaAvailableLineCollapsed: false,
		});

		await this.boardDoRepo.save(mediaBoard);

		return mediaBoard;
	}

	public async updateAvailableLineColor(mediaBoard: MediaBoard, color: MediaBoardColors) {
		if (color) {
			mediaBoard.mediaAvailableLineBackgroundColor = color;
		}

		await this.boardDoRepo.save(mediaBoard);
	}

	public async collapseAvailableLine(mediaBoard: MediaBoard, mediaAvailableLineCollapsed: boolean) {
		mediaBoard.mediaAvailableLineCollapsed = mediaAvailableLineCollapsed;

		await this.boardDoRepo.save(mediaBoard);
	}

	public async setLayout(mediaBoard: MediaBoard, layout: MediaBoardLayoutType) {
		mediaBoard.layout = layout;

		await this.boardDoRepo.save(mediaBoard);
	}

	public async delete(board: MediaBoard): Promise<void> {
		await this.boardDoService.deleteWithDescendants(board);
	}

	public async deleteByExternalReference(reference: BoardExternalReference): Promise<number> {
		return this.boardDoRepo.deleteByExternalReference(reference);
	}
}
