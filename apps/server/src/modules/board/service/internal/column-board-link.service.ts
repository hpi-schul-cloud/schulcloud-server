import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode, isLinkElement } from '../../domain';
import { BoardNodeRepo } from '../../repo/board-node.repo';

@Injectable()
export class ColumnBoardLinkService {
	constructor(private readonly boardNodeRepo: BoardNodeRepo) {}

	public async swapLinkedIdsInBoardNode(
		boardNode: AnyBoardNode,
		idMap?: Map<EntityId, EntityId>
	): Promise<AnyBoardNode> {
		this.updateLinkElements(boardNode, idMap ?? new Map<EntityId, EntityId>());
		await this.boardNodeRepo.save(boardNode);
		return boardNode;
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
