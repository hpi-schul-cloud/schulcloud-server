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
import type { CollaborativeTextEditorElement } from '../collaborative-text-editor.do';

import type { MediaBoard, MediaExternalToolElement, MediaLine } from '../media-board';

export type AnyMediaBoardNode = MediaBoard | MediaLine | MediaExternalToolElement;

export type AnyBoardNode =
	| AnyMediaBoardNode
	| Card
	| CollaborativeTextEditorElement
	| Column
	| ColumnBoard
	| DrawingElement
	| ExternalToolElement
	| FileElement
	| LinkElement
	| RichTextElement
	| SubmissionContainerElement
	| SubmissionItem;
