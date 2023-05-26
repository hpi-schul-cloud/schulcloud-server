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

	async findAllByParentReference(parentId: EntityId): Promise<ColumnBoard[]> {
		const boards = await this.boardDoRepo.findByExternalParentId(parentId);
		return boards;
	}

	async create(context: BoardExternalReference): Promise<ColumnBoard> {
		const board = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			context,
		});
		await this.boardDoRepo.save(board);
		return board;
	}

	async delete(board: ColumnBoard): Promise<void> {
		await this.boardDoService.deleteWithDescendants(board);
	}

	async updateTitle(board: ColumnBoard, title: string): Promise<void> {
		board.title = title;
		await this.boardDoRepo.save(board);
	}
}
