import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode, Column, ColumnBoard, isLinkElement } from '../../domain';
import { BoardNodeRepo } from '../../repo/board-node.repo';
import { BoardNodeService } from '../board-node.service';

@Injectable()
export class ColumnBoardLinkService {
	constructor(
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeRepo: BoardNodeRepo
	) {}

	public async swapLinkedIds(boardId: EntityId, idMap: Map<EntityId, EntityId>): Promise<ColumnBoard> {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);

		this.updateLinkElements(board, idMap);
		await this.boardNodeRepo.save(board);

		return board;
	}

	public async swapLinkedIdsInColumn(columnId: EntityId, idMap: Map<EntityId, EntityId>): Promise<Column> {
		const column = await this.boardNodeService.findByClassAndId(Column, columnId);

		this.updateLinkElements(column, idMap);
		await this.boardNodeRepo.save(column);

		return column;
	}

	private updateLinkElements(boardNode: AnyBoardNode, idMap: Map<EntityId, EntityId>): void {
		if (isLinkElement(boardNode)) {
			idMap.forEach((value, key) => {
				boardNode.url = boardNode.url.replace(key, value);
			});
		}
		boardNode.children.forEach((bn) => this.updateLinkElements(bn, idMap));
	}
}
