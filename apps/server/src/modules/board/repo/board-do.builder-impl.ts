import { NotImplementedException } from '@nestjs/common';
import type {
	BoardDoBuilder,
	BoardNode,
	CardNode,
	ColumnBoardNode,
	ColumnNode,
	ExternalToolElementNodeEntity,
	FileElementNode,
	RichTextElementNode,
	SubmissionContainerElementNode,
	SubmissionItemNode,
} from '@shared/domain';
import {
	AnyBoardDo,
	BoardNodeType,
	Card,
	Column,
	ColumnBoard,
	ExternalToolElement,
	FileElement,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain';

export class BoardDoBuilderImpl implements BoardDoBuilder {
	private childrenMap: Record<string, BoardNode[]> = {};

	constructor(descendants: BoardNode[] = []) {
		for (const boardNode of descendants) {
			this.childrenMap[boardNode.path] ||= [];
			this.childrenMap[boardNode.path].push(boardNode);
		}
	}

	public buildDomainObject<T extends AnyBoardDo>(boardNode: BoardNode): T {
		return boardNode.useDoBuilder(this) as T;
	}

	public buildColumnBoard(boardNode: ColumnBoardNode): ColumnBoard {
		this.ensureBoardNodeType(this.getChildren(boardNode), BoardNodeType.COLUMN);

		const columns = this.buildChildren<Column>(boardNode);

		const columnBoard = new ColumnBoard({
			id: boardNode.id,
			title: boardNode.title ?? '',
			children: columns,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
			context: boardNode.context,
		});

		return columnBoard;
	}

	public buildColumn(boardNode: ColumnNode): Column {
		this.ensureBoardNodeType(this.getChildren(boardNode), BoardNodeType.CARD);

		const cards = this.buildChildren<Card>(boardNode);

		const column = new Column({
			id: boardNode.id,
			title: boardNode.title ?? '',
			children: cards,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return column;
	}

	public buildCard(boardNode: CardNode): Card {
		this.ensureBoardNodeType(this.getChildren(boardNode), [
			BoardNodeType.FILE_ELEMENT,
			BoardNodeType.RICH_TEXT_ELEMENT,
			BoardNodeType.SUBMISSION_CONTAINER_ELEMENT,
			BoardNodeType.EXTERNAL_TOOL,
		]);

		const elements = this.buildChildren<RichTextElement | SubmissionContainerElement>(boardNode);

		const card = new Card({
			id: boardNode.id,
			title: boardNode.title ?? '',
			height: boardNode.height,
			children: elements,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return card;
	}

	public buildFileElement(boardNode: FileElementNode): FileElement {
		this.ensureLeafNode(boardNode);

		const element = new FileElement({
			id: boardNode.id,
			caption: boardNode.caption,
			alternativeText: boardNode.alternativeText,
			children: [],
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return element;
	}

	public buildRichTextElement(boardNode: RichTextElementNode): RichTextElement {
		this.ensureLeafNode(boardNode);

		const element = new RichTextElement({
			id: boardNode.id,
			text: boardNode.text,
			inputFormat: boardNode.inputFormat,
			children: [],
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return element;
	}

	public buildSubmissionContainerElement(boardNode: SubmissionContainerElementNode): SubmissionContainerElement {
		this.ensureBoardNodeType(this.getChildren(boardNode), [BoardNodeType.SUBMISSION_ITEM]);
		const elements = this.buildChildren<SubmissionItem>(boardNode);

		const element = new SubmissionContainerElement({
			id: boardNode.id,
			dueDate: boardNode.dueDate,
			children: elements,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
		});
		return element;
	}

	public buildSubmissionItem(boardNode: SubmissionItemNode): SubmissionItem {
		this.ensureLeafNode(boardNode);

		const element = new SubmissionItem({
			id: boardNode.id,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
			completed: boardNode.completed,
			userId: boardNode.userId,
			children: [],
		});
		return element;
	}

	buildExternalToolElement(boardNode: ExternalToolElementNodeEntity): ExternalToolElement {
		this.ensureLeafNode(boardNode);

		const element: ExternalToolElement = new ExternalToolElement({
			id: boardNode.id,
			children: [],
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
			contextExternalToolId: boardNode.contextExternalTool?.id,
		});

		return element;
	}

	buildChildren<T extends AnyBoardDo>(boardNode: BoardNode): T[] {
		const children = this.getChildren(boardNode).map((node) => node.useDoBuilder(this));
		return children as T[];
	}

	getChildren(boardNode: BoardNode): BoardNode[] {
		const children = this.childrenMap[boardNode.pathOfChildren] || [];
		const sortedChildren = children.sort((a, b) => a.position - b.position);
		return sortedChildren;
	}

	ensureLeafNode(boardNode: BoardNode) {
		const children = this.getChildren(boardNode);
		if (children.length !== 0) throw new Error('BoardNode is a leaf node but children were provided.');
	}

	ensureBoardNodeType(boardNode: BoardNode | BoardNode[], type: BoardNodeType | BoardNodeType[]) {
		const single = (bn: BoardNode, t: BoardNodeType | BoardNodeType[]) => {
			const isValid = Array.isArray(t) ? type.includes(bn.type) : t === bn.type;
			if (!isValid) {
				throw new NotImplementedException(`Invalid node type '${bn.type}'`);
			}
		};

		if (Array.isArray(boardNode)) {
			boardNode.forEach((bn) => single(bn, type));
		} else {
			single(boardNode, type);
		}
	}
}
