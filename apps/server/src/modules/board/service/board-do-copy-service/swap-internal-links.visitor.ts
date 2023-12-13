import {
	AnyBoardDo,
	BoardCompositeVisitor,
	Card,
	Column,
	ColumnBoard,
	LinkElement,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain/domainobject';
import { DrawingElement } from '@shared/domain/domainobject/board/drawing-element.do';
import { EntityId } from '@shared/domain/types';

export class SwapInternalLinksVisitor implements BoardCompositeVisitor {
	constructor(map: Map<EntityId, EntityId>) {
		this.idMap = map;
	}

	private idMap: Map<EntityId, EntityId>;

	visitDrawingElement(drawingElement: DrawingElement): void {
		this.visitChildrenOf(drawingElement);
	}

	visitCard(card: Card): void {
		this.visitChildrenOf(card);
	}

	visitColumn(column: Column): void {
		this.visitChildrenOf(column);
	}

	visitColumnBoard(columnBoard: ColumnBoard): void {
		this.visitChildrenOf(columnBoard);
	}

	visitExternalToolElement(): void {}

	visitFileElement(): void {}

	visitLinkElement(linkElement: LinkElement): void {
		this.idMap.forEach((value, key) => {
			linkElement.url = linkElement.url.replace(key, value);
		});
	}

	visitRichTextElement(): void {}

	visitSubmissionContainerElement(submissionContainerElement: SubmissionContainerElement): void {
		this.visitChildrenOf(submissionContainerElement);
	}

	visitSubmissionItem(submissionItem: SubmissionItem): void {
		this.visitChildrenOf(submissionItem);
	}

	private visitChildrenOf(boardDo: AnyBoardDo) {
		boardDo.children.forEach((child) => child.accept(this));
	}
}
