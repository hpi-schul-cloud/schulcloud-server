import {
	AnyBoardDo,
	BoardCompositeVisitor,
	Card,
	Column,
	ColumnBoard,
	DrawingElement,
	LinkElement,
	MediaBoard,
	MediaLine,
	SubmissionContainerElement,
	SubmissionItem,
} from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';

export class SwapInternalLinksVisitor implements BoardCompositeVisitor {
	constructor(private readonly idMap: Map<EntityId, EntityId>) {}

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

	visitExternalToolElement(): void {
		this.doNothing();
	}

	visitFileElement(): void {
		this.doNothing();
	}

	visitLinkElement(linkElement: LinkElement): void {
		this.idMap.forEach((value, key) => {
			linkElement.url = linkElement.url.replace(key, value);
		});
	}

	visitRichTextElement(): void {
		this.doNothing();
	}

	visitSubmissionContainerElement(submissionContainerElement: SubmissionContainerElement): void {
		this.visitChildrenOf(submissionContainerElement);
	}

	visitSubmissionItem(submissionItem: SubmissionItem): void {
		this.visitChildrenOf(submissionItem);
	}

	private visitChildrenOf(boardDo: AnyBoardDo) {
		boardDo.children.forEach((child) => child.accept(this));
	}

	private doNothing() {}

	visitMediaBoard(mediaBoard: MediaBoard): void {
		this.visitChildrenOf(mediaBoard);
	}

	visitMediaLine(mediaLine: MediaLine): void {
		this.visitChildrenOf(mediaLine);
	}

	visitMediaExternalToolElement(): void {
		this.doNothing();
	}
}
