import { BoardNode, BoardNodeType, ContentElement } from '@shared/domain';
import { BoardDoBuilder } from './board-do-builder';

export class ElementBuilder extends BoardDoBuilder {
	public build(boardNode: BoardNode): ContentElement {
		this.ensureBoardNodeType(boardNode, BoardNodeType.ELEMENT);

		const element = new ContentElement({
			id: boardNode.id,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return element;
	}
}
