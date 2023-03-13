import { Injectable } from '@nestjs/common';
import { ColumnBoard, EntityId } from '@shared/domain';
import { ColumnBoardRepo } from '../repo';

@Injectable()
export class ColumnBoardService {
	constructor(private readonly columnBoardRepo: ColumnBoardRepo) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.columnBoardRepo.findById(boardId);
		return board;
	}
}
