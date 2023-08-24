import { DrawingElement } from '../drawing-element.do';
import type { Card } from '../card.do';
import type { ColumnBoard } from '../column-board.do';
import type { Column } from '../column.do';
import type { FileElement } from '../file-element.do';
import { RichTextElement } from '../rich-text-element.do';
import { SubmissionContainerElement } from '../submission-container-element.do';
import { SubmissionItem } from '../submission-item.do';

export interface BoardCompositeVisitor {
	visitColumnBoard(columnBoard: ColumnBoard): void;
	visitColumn(column: Column): void;
	visitCard(card: Card): void;
	visitFileElement(fileElement: FileElement): void;
	visitRichTextElement(richTextElement: RichTextElement): void;
	visitDrawingElement(drawingElement: DrawingElement): void;
	visitSubmissionContainerElement(submissionContainerElement: SubmissionContainerElement): void;
	visitSubmissionItem(submissionItem: SubmissionItem): void;
}

export interface BoardCompositeVisitorAsync {
	visitColumnBoardAsync(columnBoard: ColumnBoard): Promise<void>;
	visitColumnAsync(column: Column): Promise<void>;
	visitCardAsync(card: Card): Promise<void>;
	visitFileElementAsync(fileElement: FileElement): Promise<void>;
	visitRichTextElementAsync(richTextElement: RichTextElement): Promise<void>;
	visitDrawingElementAsync(drawingElement: DrawingElement): Promise<void>;
	visitSubmissionContainerElementAsync(submissionContainerElement: SubmissionContainerElement): Promise<void>;
	visitSubmissionItemAsync(submissionItem: SubmissionItem): Promise<void>;
}
