import type { Card } from '../card.do';
import { CollaborativeTextEditorElement } from '../collaborative-text-editor-element.do';
import type { ColumnBoard } from '../column-board.do';
import type { Column } from '../column.do';
import type { DrawingElement } from '../drawing-element.do';
import type { ExternalToolElement } from '../external-tool-element.do';
import type { FileElement } from '../file-element.do';
import type { LinkElement } from '../link-element.do';
import type { MediaBoard, MediaExternalToolElement, MediaLine } from '../media-board';
import type { RichTextElement } from '../rich-text-element.do';
import type { SubmissionContainerElement } from '../submission-container-element.do';
import type { SubmissionItem } from '../submission-item.do';

export interface BoardCompositeVisitor extends MediaBoardCompositeVisitor, ColumnBoardCompositeVisitor {}
export interface BoardCompositeVisitorAsync extends MediaBoardCompositeVisitorAsync, ColumnBoardCompositeVisitorAsync {}

export interface ColumnBoardCompositeVisitor {
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
	visitCollaborativeTextEditorElement(collaborativeTextEditorElement: CollaborativeTextEditorElement): void;
}

export interface ColumnBoardCompositeVisitorAsync {
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
	visitCollaborativeTextEditorElementAsync(
		collaborativeTextEditorElement: CollaborativeTextEditorElement
	): Promise<void>;
}

export interface MediaBoardCompositeVisitor {
	visitMediaBoard(mediaBoard: MediaBoard): void;
	visitMediaLine(mediaLine: MediaLine): void;
	visitMediaExternalToolElement(mediaElement: MediaExternalToolElement): void;
}

export interface MediaBoardCompositeVisitorAsync {
	visitMediaBoardAsync(mediaBoard: MediaBoard): Promise<void>;
	visitMediaLineAsync(mediaLine: MediaLine): Promise<void>;
	visitMediaExternalToolElementAsync(mediaElement: MediaExternalToolElement): Promise<void>;
}
