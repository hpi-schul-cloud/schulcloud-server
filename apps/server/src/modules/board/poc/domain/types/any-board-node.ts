import type { Card } from '../card.do';
import type { Column } from '../column.do';
import type { ColumnBoard } from '../colum-board.do';
import type { DrawingElement } from '../drawing-element.do';
import type { ExternalToolElement } from '../external-tool-element.do';
import type { FileElement } from '../file-element.do';
import type { LinkElement } from '../link-element.do';
import type { RichTextElement } from '../rich-text-element.do';
import type { SubmissionContainerElement } from '../submission-container-element.do';
import type { SubmissionItem } from '../submission-item.do';
import type { CollaborativeTextEditor } from '../collaborative-text-editor.do';

export type AnyBoardNode =
	| Card
	| CollaborativeTextEditor
	| Column
	| ColumnBoard
	| DrawingElement
	| ExternalToolElement
	| FileElement
	| LinkElement
	| RichTextElement
	| SubmissionContainerElement
	| SubmissionItem
	| SubmissionItem;
