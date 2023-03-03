import { BoardNode, BoardNodeType, ContentElement } from '@shared/domain';

export class ElementBuilder {
	public static build(boardNode: BoardNode): ContentElement | undefined {
		if (boardNode.type !== BoardNodeType.ELEMENT) return undefined;

		const element = new ContentElement({
			id: boardNode.id,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return element;
	}
}
