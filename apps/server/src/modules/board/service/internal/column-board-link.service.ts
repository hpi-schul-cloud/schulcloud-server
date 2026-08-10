import { Injectable } from '@nestjs/common';
import { AnyBoardNode, isLinkElement } from '../../domain';
import { BoardNodeRepo } from '../../repo/board-node.repo';

@Injectable()
export class ColumnBoardLinkService {
	constructor(private readonly boardNodeRepo: BoardNodeRepo) {}

	public async rewriteLinkUrlsInBoardNode(
		boardNode: AnyBoardNode,
		replacementMap?: Record<string, string>
	): Promise<AnyBoardNode> {
		this.updateLinkElements(boardNode, replacementMap ?? {});
		await this.boardNodeRepo.save(boardNode);
		return boardNode;
	}

	private updateLinkElements(boardNode: AnyBoardNode, replacementMap: Record<string, string>): void {
		if (isLinkElement(boardNode)) {
			for (const [searchValue, replaceValue] of Object.entries(replacementMap)) {
				boardNode.url = boardNode.url.replace(searchValue, replaceValue);
			}
		}
		boardNode.children.forEach((bn) => this.updateLinkElements(bn, replacementMap));
	}
}
