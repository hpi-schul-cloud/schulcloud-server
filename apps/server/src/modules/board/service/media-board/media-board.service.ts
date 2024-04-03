import { ObjectId } from '@mikro-orm/mongodb';
import type { AuthorizationLoaderServiceGeneric } from '@modules/authorization';
import { Injectable } from '@nestjs/common';
import { BoardExternalReference, MediaBoard } from '@shared/domain/domainobject';
import type { EntityId } from '@shared/domain/types';
import type { BoardDoRepo } from '../../repo';
import type { BoardDoService } from '../board-do.service';

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

	public async create(context: BoardExternalReference): Promise<MediaBoard> {
		const mediaBoard: MediaBoard = new MediaBoard({
			id: new ObjectId().toHexString(),
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context,
		});

		await this.boardDoRepo.save(mediaBoard);

		return mediaBoard;
	}

	public async delete(board: MediaBoard): Promise<void> {
		await this.boardDoService.deleteWithDescendants(board);
	}

	public async deleteByExternalReference(reference: BoardExternalReference): Promise<number> {
		return this.boardDoRepo.deleteByExternalReference(reference);
	}
}
