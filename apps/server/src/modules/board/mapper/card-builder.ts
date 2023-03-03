import { BoardNode, BoardNodeType, Card, ContentElement } from '@shared/domain';
import { AnyBoardDo } from '../types/any-board-do';
import { BoardDoBuilder } from './board-do-builder';

export class CardBuilder extends BoardDoBuilder {
	public build(boardNode: BoardNode, children: AnyBoardDo[] = []): Card {
		this.ensureBoardNodeType(boardNode, BoardNodeType.CARD);

		const elements = children.filter((c) => c.constructor.name === 'ContentElement') as ContentElement[];

		const column = new Card({
			id: boardNode.id,
			title: '',
			height: 150,
			elements,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return column;
	}
}
