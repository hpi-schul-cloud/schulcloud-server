import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import {
	AnyBoardDo,
	BoardExternalReference,
	BoardExternalReferenceType,
	ColumnBoard,
	ContentElementFactory,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { ObjectId } from 'bson';
import { BoardDoRepo } from '../repo';
import { BoardDoService } from './board-do.service';

@Injectable()
export class ColumnBoardService {
	constructor(
		private readonly boardDoRepo: BoardDoRepo,
		private readonly boardDoService: BoardDoService,
		private readonly contentElementFactory: ContentElementFactory
	) {}

	async findById(boardId: EntityId): Promise<ColumnBoard> {
		const board = await this.boardDoRepo.findByClassAndId(ColumnBoard, boardId);

		return board;
	}

	async findIdsByExternalReference(reference: BoardExternalReference): Promise<EntityId[]> {
		const ids = this.boardDoRepo.findIdsByExternalReference(reference);

		return ids;
	}

	async findByDescendant(boardDo: AnyBoardDo): Promise<ColumnBoard> {
		const ancestorIds: EntityId[] = await this.boardDoRepo.getAncestorIds(boardDo);
		const idHierarchy: EntityId[] = [...ancestorIds, boardDo.id];
		const rootId: EntityId = idHierarchy[0];
		const rootBoardDo: AnyBoardDo = await this.boardDoRepo.findById(rootId, 1);

		if (rootBoardDo instanceof ColumnBoard) {
			return rootBoardDo;
		}

		throw new NotFoundLoggableException(ColumnBoard.name, { id: rootId });
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
}
