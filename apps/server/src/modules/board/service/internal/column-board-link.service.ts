import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { AnyBoardNode, isLinkElement } from '../../domain';
import { BoardNodeRepo } from '../../repo/board-node.repo';
import { BoardNodeService } from '../board-node.service';

@Injectable()
export class ColumnBoardLinkService {
	constructor(
		private readonly boardNodeService: BoardNodeService,
		private readonly boardNodeRepo: BoardNodeRepo
	) {}

	public async swapLinkedIdsInBoardNode(nodeId: EntityId, idMap: Map<EntityId, EntityId>): Promise<AnyBoardNode> {
		const node = await this.boardNodeService.findById(nodeId);

		this.updateLinkElements(node, idMap);
		await this.boardNodeRepo.save(node);

		return node;
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
