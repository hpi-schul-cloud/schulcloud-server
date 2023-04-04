import {
	EntityId,
	AnyBoardDo,
	BoardNodeBuilder,
	Card,
	Column,
	ColumnBoard,
	TextElement,
	BoardNode,
	CardNode,
	ColumnBoardNode,
	ColumnNode,
	TextElementNode,
	BoardNodeType,
} from '@shared/domain';

export class BoardNodeBuilderImpl implements BoardNodeBuilder {
	private parentsMap: Map<EntityId, BoardNode> = new Map();

	private resultNodes: BoardNode[] = [];

	constructor(parentNode?: BoardNode) {
		if (parentNode) {
			this.parentsMap.set(parentNode.id, parentNode);
		}
	}

	buildBoardNodes(domainObjects: AnyBoardDo[], parentId?: EntityId): BoardNode[] {
		this.buildChildren(domainObjects, parentId);
		return this.resultNodes;
	}

	buildColumnBoardNode(columnBoard: ColumnBoard): void {
		const columnBoardNode = new ColumnBoardNode({
			id: columnBoard.id,
			title: columnBoard.title,
		});
		this.registerNode(columnBoardNode);

		this.buildChildren(columnBoard.children, columnBoardNode.id);
	}

	buildColumnNode(column: Column, parentId?: EntityId, position?: number): void {
		const parent = this.getParent(parentId);
		this.ensureBoardNodeType(parent, BoardNodeType.COLUMN_BOARD);

		const columnNode = new ColumnNode({
			id: column.id,
			title: column.title,
			parent,
			position,
		});
		this.registerNode(columnNode);

		this.buildChildren(column.children, columnNode.id);
	}

	buildCardNode(card: Card, parentId?: EntityId, position?: number): void {
		const parent = this.getParent(parentId);
		this.ensureBoardNodeType(parent, BoardNodeType.COLUMN);

		const cardNode = new CardNode({
			id: card.id,
			height: card.height,
			title: card.title,
			parent,
			position,
		});
		this.registerNode(cardNode);

		this.buildChildren(card.children, cardNode.id);
	}

	buildTextElementNode(textElement: TextElement, parentId?: EntityId, position?: number): void {
		const parent = this.getParent(parentId);
		this.ensureBoardNodeType(parent, BoardNodeType.CARD);

		const textElementNode = new TextElementNode({
			id: textElement.id,
			text: textElement.text,
			parent,
			position,
		});
		this.registerNode(textElementNode);
	}

	registerNode(boardNode: BoardNode) {
		this.parentsMap.set(boardNode.id, boardNode);
		this.resultNodes.push(boardNode);
	}

	getParent(parentId?: EntityId): BoardNode | undefined {
		const parent = parentId ? this.parentsMap.get(parentId) : undefined;
		return parent;
	}

	ensureBoardNodeType(boardNode: BoardNode | undefined, ...allowedBoardNodeTypes: BoardNodeType[]) {
		if (boardNode && !allowedBoardNodeTypes.includes(boardNode.type)) {
			throw new Error(`board node type is not allowed: >${boardNode.type}<`);
		}
	}

	buildChildren(children: AnyBoardDo[], parentId?: EntityId): void {
		children.forEach((domainObject, position) => domainObject.useBoardNodeBuilder(this, parentId, position));
	}
}
