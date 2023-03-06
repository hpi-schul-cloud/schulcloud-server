import { BoardNode, BoardNodeType, TextElement, TextElementPayload } from '@shared/domain';
import { BoardDoBuilder } from './board-do-builder';

export class TextElementBuilder extends BoardDoBuilder {
	public build(boardNode: BoardNode): TextElement {
		this.ensureBoardNodeType(boardNode, BoardNodeType.TEXT_ELEMENT);

		const payload = boardNode.payload as TextElementPayload;
		const element = new TextElement({
			id: boardNode.id,
			text: payload.text,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return element;
	}
}
