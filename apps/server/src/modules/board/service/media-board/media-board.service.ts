import { ObjectId } from '@mikro-orm/mongodb';
import type { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { AnyBoardDo, BoardExternalReference, ColumnBoard, MediaBoard } from '@shared/domain/domainobject';
import type { EntityId } from '@shared/domain/types';
import { MediaBoardColors, MediaBoardLayoutType } from '../../domain';
import { InvalidBoardTypeLoggableException } from '../../loggable';
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

		if (!(mediaBoard instanceof MediaBoard)) {
			throw new InvalidBoardTypeLoggableException(MediaBoard, mediaBoard.id);
		}

		return mediaBoard;
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

	public async updateAvailableLineColor(mediaBoard: MediaBoard, color: MediaBoardColors): Promise<void> {
		mediaBoard.mediaAvailableLineBackgroundColor = color;

		await this.boardDoRepo.save(mediaBoard);
	}

	public async collapseAvailableLine(mediaBoard: MediaBoard, mediaAvailableLineCollapsed: boolean): Promise<void> {
		mediaBoard.mediaAvailableLineCollapsed = mediaAvailableLineCollapsed;

		await this.boardDoRepo.save(mediaBoard);
	}

	public async setLayout(mediaBoard: MediaBoard, layout: MediaBoardLayoutType): Promise<void> {
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
