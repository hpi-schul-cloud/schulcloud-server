import { BoardNode, BoardNodeType, TextElement, TextElementNode } from '@shared/domain';
import { BoardDoBuilder } from './board-do-builder';

export class TextElementBuilder extends BoardDoBuilder {
	public build(boardNode: BoardNode): TextElement {
		this.ensureBoardNodeType(boardNode, BoardNodeType.TEXT_ELEMENT);

		const element = new TextElement({
			id: boardNode.id,
			text: (boardNode as TextElementNode).text,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return element;
	}
}
