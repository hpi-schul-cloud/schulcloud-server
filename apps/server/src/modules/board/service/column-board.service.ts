import { Injectable, NotFoundException } from '@nestjs/common';
import { Card, Column, ColumnBoard, EntityId } from '@shared/domain';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';

@Injectable()
export class ColumnBoardService {
	constructor(private readonly boardDoRepo: BoardDoRepo) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.boardDoRepo.findById(boardId, 2);
		if (board instanceof ColumnBoard) {
			return board;
		}
		throw new NotFoundException('There is no columboard with this id');
	}

	async createBoard(): Promise<ColumnBoard> {
		const board = new ColumnBoard({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.boardDoRepo.save(board);

		return board;
	}

	async createColumn(boardId: EntityId): Promise<Column> {
		const board = await this.boardDoRepo.findById(boardId);

		const column = new Column({
			id: new ObjectId().toHexString(),
			title: '',
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		board.addChild(column);

		await this.boardDoRepo.save(board.children, board.id);

		return column;
	}

	async createCard(boardId: EntityId, columnId: EntityId): Promise<Card> {
		const board = await this.boardDoRepo.findById(boardId);
		const column = board.getChild(columnId);

		const card = new Card({
			id: new ObjectId().toHexString(),
			title: ``,
			height: 150,
			children: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		column.addChild(card);

		await this.boardDoRepo.save(column.children, column.id);

		return card;
	}
}
