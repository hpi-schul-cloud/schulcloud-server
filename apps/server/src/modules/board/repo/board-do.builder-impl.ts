import { NotImplementedException } from '@nestjs/common';
import {
	AnyBoardDo,
	Card,
	CollaborativeTextEditorElement,
	Column,
	ColumnBoard,
	DrawingElement,
	ExternalToolElement,
	FileElement,
	LinkElement,
	MediaBoard,
	MediaExternalToolElement,
	MediaLine,
	RichTextElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain/domainobject';
import {
	type BoardDoBuilder,
	type BoardNode,
	BoardNodeType,
	type CardNode,
	type CollaborativeTextEditorElementNode,
	type ColumnBoardNode,
	type ColumnNode,
	type DrawingElementNode,
	type ExternalToolElementNodeEntity,
	type FileElementNode,
	type LinkElementNode,
	type MediaBoardNode,
	type MediaExternalToolElementNode,
	type MediaLineNode,
	type RichTextElementNode,
	type SubmissionContainerElementNode,
	type SubmissionItemNode,
} from '@shared/domain/entity';
import { MediaBoardLayoutType } from '../controller/media-board/types/layout-type.enum';
import { MediaBoardColors } from '../controller/media-board/types/media-colors.enum';

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
			isVisible: boardNode.isVisible ?? false,
			layout: boardNode.layout,
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
			BoardNodeType.LINK_ELEMENT,
			BoardNodeType.RICH_TEXT_ELEMENT,
			BoardNodeType.DRAWING_ELEMENT,
			BoardNodeType.SUBMISSION_CONTAINER_ELEMENT,
			BoardNodeType.EXTERNAL_TOOL,
			BoardNodeType.COLLABORATIVE_TEXT_EDITOR,
		]);

		const elements = this.buildChildren<
			ExternalToolElement | FileElement | LinkElement | RichTextElement | SubmissionContainerElement
		>(boardNode);

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

	public buildLinkElement(boardNode: LinkElementNode): LinkElement {
		this.ensureLeafNode(boardNode);

		const element = new LinkElement({
			id: boardNode.id,
			url: boardNode.url,
			title: boardNode.title,
			imageUrl: boardNode.imageUrl,
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

	public buildDrawingElement(boardNode: DrawingElementNode): DrawingElement {
		this.ensureLeafNode(boardNode);

		const element = new DrawingElement({
			id: boardNode.id,
			description: boardNode.description,
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
			children: elements,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
			dueDate: boardNode.dueDate,
		});

		return element;
	}

	public buildSubmissionItem(boardNode: SubmissionItemNode): SubmissionItem {
		this.ensureBoardNodeType(this.getChildren(boardNode), [
			BoardNodeType.FILE_ELEMENT,
			BoardNodeType.RICH_TEXT_ELEMENT,
		]);
		const elements = this.buildChildren<RichTextElement | FileElement>(boardNode);

		const element = new SubmissionItem({
			id: boardNode.id,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
			completed: boardNode.completed,
			userId: boardNode.userId,
			children: elements,
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

	buildCollaborativeTextEditorElement(boardNode: CollaborativeTextEditorElementNode): CollaborativeTextEditorElement {
		this.ensureLeafNode(boardNode);

		const element: CollaborativeTextEditorElement = new CollaborativeTextEditorElement({
			id: boardNode.id,
			children: [],
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
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

	buildMediaBoard(boardNode: MediaBoardNode): MediaBoard {
		this.ensureBoardNodeType(this.getChildren(boardNode), BoardNodeType.MEDIA_LINE);

		const lines: MediaLine[] = this.buildChildren<MediaLine>(boardNode);

		const mediaBoard: MediaBoard = new MediaBoard({
			id: boardNode.id,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
			children: lines,
			context: boardNode.context,
			layout: MediaBoardLayoutType.LIST,
			mediaAvailableLineBackgroundColor: MediaBoardColors.TRANSPARENT,
			mediaAvailableLineCollapsed: false,
		});

		return mediaBoard;
	}

	buildMediaLine(boardNode: MediaLineNode): MediaLine {
		this.ensureBoardNodeType(this.getChildren(boardNode), BoardNodeType.MEDIA_EXTERNAL_TOOL_ELEMENT);

		const elements: MediaExternalToolElement[] = this.buildChildren<MediaExternalToolElement>(boardNode);

		const mediaLine: MediaLine = new MediaLine({
			id: boardNode.id,
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
			children: elements,
			title: boardNode.title,
			backgroundColor: boardNode.backgroundColor,
			collapsed: boardNode.collapsed,
		});

		return mediaLine;
	}

	buildMediaExternalToolElement(boardNode: MediaExternalToolElementNode): MediaExternalToolElement {
		this.ensureLeafNode(boardNode);

		const element: MediaExternalToolElement = new MediaExternalToolElement({
			id: boardNode.id,
			children: [],
			createdAt: boardNode.createdAt,
			updatedAt: boardNode.updatedAt,
			contextExternalToolId: boardNode.contextExternalTool.id,
		});

		return element;
	}
}
