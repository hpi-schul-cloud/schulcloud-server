import { AnyBoardDo, BoardNode, BoardNodeType, Card, CardPayload, ContentElement } from '@shared/domain';
import { BoardDoBuilder } from './board-do-builder';

export class CardBuilder extends BoardDoBuilder {
	public build(boardNode: BoardNode, children: AnyBoardDo[] = []): Card {
		this.ensureBoardNodeType(boardNode, BoardNodeType.CARD);

		const elements = children.filter((c) => c.constructor.name === 'ContentElement') as ContentElement[];

		const payload = boardNode.payload as CardPayload;
		const card = new Card({
			id: boardNode.id,
			title: payload.name,
			height: payload.height,
			elements,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return card;
	}
}
