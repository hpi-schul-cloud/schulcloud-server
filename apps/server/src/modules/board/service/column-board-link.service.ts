import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode, ColumnBoard, isLinkElement } from '../domain';
import { BoardNodeRepo } from '../repo';
import { BoardNodeService } from './board-node.service';

@Injectable()
export class ColumnBoardLinkService {
	constructor(private readonly boardNodeService: BoardNodeService, private readonly boardNodeRepo: BoardNodeRepo) {}

	async swapLinkedIds(boardId: EntityId, idMap: Map<EntityId, EntityId>) {
		const board = await this.boardNodeService.findByClassAndId(ColumnBoard, boardId);

		this.updateLinkElements(board, idMap);
		await this.boardNodeRepo.save(board);

		return board;
	}

	private updateLinkElements(boardNode: AnyBoardNode, idMap: Map<EntityId, EntityId>) {
		if (isLinkElement(boardNode)) {
			idMap.forEach((value, key) => {
				boardNode.url = boardNode.url.replace(key, value);
			});
		}
		boardNode.children.forEach((bn) => this.updateLinkElements(bn, idMap));
	}
}
