import type { Card } from '../card.do';
import type { CollaborativeTextEditorElement } from '../collaborative-text-editor.do';
import type { ColumnBoard } from '../colum-board.do';
import type { Column } from '../column.do';
import type { DeletedElement } from '../deleted-element.do';
import type { DrawingElement } from '../drawing-element.do';
import type { ExternalToolElement } from '../external-tool-element.do';
import type { FileElement } from '../file-element.do';
import type { FileFolderElement } from '../file-folder-element.do';
import type { H5pElement } from '../h5p-element.do';
import type { LinkElement } from '../link-element.do';
import type { AnyMediaBoardNode } from '../media-board';
import type { RichTextElement } from '../rich-text-element.do';
import type { VideoConferenceElement } from '../video-conference-element.do';

export type AnyBoardNode =
	| CollaborativeTextEditorElement
	| DrawingElement
	| ExternalToolElement
	| FileElement
	| FileFolderElement
	| H5pElement
	| LinkElement
	| RichTextElement
	| DeletedElement
	| VideoConferenceElement
	| AnyMediaBoardNode
	| Card
	| Column
	| ColumnBoard;
