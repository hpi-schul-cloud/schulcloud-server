import { Injectable } from '@nestjs/common';
import {
	AnyBoardDo,
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoard,
	MediaBoard,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from '@mikro-orm/mongodb';
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

	async findByDescendant(boardDo: AnyBoardDo): Promise<ColumnBoard | MediaBoard> {
		const rootboardDo = this.boardDoService.getRootBoardDo(boardDo);

		return rootboardDo;
	}

	async getBoardObjectTitlesById(boardIds: EntityId[]): Promise<Record<EntityId, string>> {
		const titleMap = this.boardDoRepo.getTitlesByIds(boardIds);
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
			isVisible: false,
		});

		await this.boardDoRepo.save(columnBoard);

		return columnBoard;
	}

	async delete(board: ColumnBoard): Promise<void> {
		await this.boardDoService.deleteWithDescendants(board);
	}

	async deleteByCourseId(courseId: EntityId): Promise<void> {
		const columnBoardsId = await this.findIdsByExternalReference({
			type: BoardExternalReferenceType.Course,
			id: courseId,
		});

		const deletePromises = columnBoardsId.map((columnBoardId) => this.deleteColumnBoardById(columnBoardId));

		await Promise.all(deletePromises);
	}

	private async deleteColumnBoardById(id: EntityId): Promise<void> {
		const columnBoardToDeletion = await this.boardDoRepo.findByClassAndId(ColumnBoard, id);

		if (columnBoardToDeletion) {
			await this.boardDoService.deleteWithDescendants(columnBoardToDeletion);
		}
	}

	async updateTitle(board: ColumnBoard, title: string): Promise<void> {
		board.title = title;
		await this.boardDoRepo.save(board);
	}

	async updateBoardVisibility(board: ColumnBoard, isVisible: boolean): Promise<void> {
		board.isVisible = isVisible;
		await this.boardDoRepo.save(board);
	}
}
