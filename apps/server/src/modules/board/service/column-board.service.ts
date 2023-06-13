import { Injectable } from '@nestjs/common';
import { BoardExternalReference, ColumnBoard, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ColumnBoardService {
	constructor(private readonly boardDoRepo: BoardDoRepo, private readonly boardDoService: BoardDoService) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.boardDoRepo.findByClassAndId(ColumnBoard, boardId);

		return board;
	}

	async findIdsByExternalReference(reference: BoardExternalReference): Promise<EntityId[]> {
		const ids = this.boardDoRepo.findIdsByExternalReference(reference);

		return ids;
	}

	async getBoardObjectTitlesById(boardIds: EntityId[]): Promise<Record<EntityId, string>> {
		const titleMap = this.boardDoRepo.getTitleById(boardIds);
		return titleMap;
	}

	async create(context: BoardExternalReference, title = ''): Promise<ColumnBoard> {
		const columnBoard = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context,
		});

		await this.boardDoRepo.save(columnBoard);

		return columnBoard;
	}

	async delete(board: ColumnBoard): Promise<void> {
		await this.boardDoService.deleteWithDescendants(board);
	}

	async updateTitle(board: ColumnBoard, title: string): Promise<void> {
		board.title = title;
		await this.boardDoRepo.save(board);
	}
}
