import { DrawingElement } from '../drawing-element.do';
import type { Card } from '../card.do';
import type { ColumnBoard } from '../column-board.do';
import type { Column } from '../column.do';
import type { ExternalToolElement } from '../external-tool-element.do';
import type { FileElement } from '../file-element.do';
import type { LinkElement } from '../link-element.do';
import type { RichTextElement } from '../rich-text-element.do';
import type { SubmissionContainerElement } from '../submission-container-element.do';
import type { SubmissionItem } from '../submission-item.do';

export interface BoardCompositeVisitor {
	visitColumnBoard(columnBoard: ColumnBoard): void;
	visitColumn(column: Column): void;
	visitCard(card: Card): void;
	visitFileElement(fileElement: FileElement): void;
	visitLinkElement(linkElement: LinkElement): void;
	visitRichTextElement(richTextElement: RichTextElement): void;
	visitDrawingElement(drawingElement: DrawingElement): void;
	visitSubmissionContainerElement(submissionContainerElement: SubmissionContainerElement): void;
	visitSubmissionItem(submissionItem: SubmissionItem): void;
	visitExternalToolElement(externalToolElement: ExternalToolElement): void;
}

export interface BoardCompositeVisitorAsync {
	visitColumnBoardAsync(columnBoard: ColumnBoard): Promise<void>;
	visitColumnAsync(column: Column): Promise<void>;
	visitCardAsync(card: Card): Promise<void>;
	visitFileElementAsync(fileElement: FileElement): Promise<void>;
	visitLinkElementAsync(linkElement: LinkElement): Promise<void>;
	visitRichTextElementAsync(richTextElement: RichTextElement): Promise<void>;
	visitDrawingElementAsync(drawingElement: DrawingElement): Promise<void>;
	visitSubmissionContainerElementAsync(submissionContainerElement: SubmissionContainerElement): Promise<void>;
	visitSubmissionItemAsync(submissionItem: SubmissionItem): Promise<void>;
	visitExternalToolElementAsync(externalToolElement: ExternalToolElement): Promise<void>;
}
