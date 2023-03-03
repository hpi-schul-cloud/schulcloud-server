import { BoardNode, BoardNodeType, Card, ContentElement } from '@shared/domain';
import { AnyBoardDo } from '../types/any-board-do';

export class CardBuilder {
	public static build(boardNode: BoardNode, children: AnyBoardDo[] = []): Card | undefined {
		if (boardNode.type !== BoardNodeType.CARD) return undefined;

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
