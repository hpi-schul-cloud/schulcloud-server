import { AnyBoardDo, BoardNode, BoardNodeType, Card, CardNode, TextElement } from '@shared/domain';
import { BoardDoBuilder } from './board-do-builder';

export class CardBuilder extends BoardDoBuilder {
	public build(boardNode: BoardNode, children: AnyBoardDo[] = []): Card {
		this.ensureBoardNodeType(boardNode, BoardNodeType.CARD);

		const elements = children.filter((c) => c.constructor.name === 'TextElement') as TextElement[];

		const card = new Card({
			id: boardNode.id,
			title: (boardNode as CardNode).title,
			height: (boardNode as CardNode).height,
			elements,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return card;
	}
}
