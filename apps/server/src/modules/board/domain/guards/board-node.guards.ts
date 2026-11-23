/**
 * Type guards for board nodes.
 * These guards are separated from the type definitions to break circular dependencies.
 * The guards require runtime references (instanceof), while type definitions only need type imports.
 */

import type { Card } from '../card.do';
import type { ColumnBoard } from '../colum-board.do';
import type { Column } from '../column.do';
import { CollaborativeTextEditorElement } from '../collaborative-text-editor.do';
import { DeletedElement } from '../deleted-element.do';
import { DrawingElement } from '../drawing-element.do';
import { ExternalToolElement } from '../external-tool-element.do';
import { FileElement } from '../file-element.do';
import { FileFolderElement } from '../file-folder-element.do';
import { H5pElement } from '../h5p-element.do';
import { LinkElement } from '../link-element.do';
import { RichTextElement } from '../rich-text-element.do';
import { VideoConferenceElement } from '../video-conference-element.do';
import type { IBoardNode } from '../interface';

// Re-export individual type guards from their respective domain objects
export { isCard } from '../card.do';
export { isCollaborativeTextEditorElement } from '../collaborative-text-editor.do';
export { isColumnBoard } from '../colum-board.do';
export { isColumn } from '../column.do';
export { isDeletedElement } from '../deleted-element.do';
export { isDrawingElement } from '../drawing-element.do';
export { isExternalToolElement } from '../external-tool-element.do';
export { isFileElement } from '../file-element.do';
export { isFileFolderElement } from '../file-folder-element.do';
export { isH5pElement } from '../h5p-element.do';
export { isLinkElement } from '../link-element.do';
export { isRichTextElement } from '../rich-text-element.do';
export { isVideoConferenceElement } from '../video-conference-element.do';
export { isAnyBoardNode } from '../board-node.do';

/**
 * Content element union type for type guards.
 * This mirrors AnyContentElement but is defined here to avoid circular imports.
 */
export type ContentElementUnion =
	| CollaborativeTextEditorElement
	| DrawingElement
	| ExternalToolElement
	| FileElement
	| FileFolderElement
	| LinkElement
	| RichTextElement
	| DeletedElement
	| VideoConferenceElement
	| H5pElement;

/**
 * Type guard to check if a board node is a content element.
 * Content elements are elements that can be placed on a Card.
 */
export const isContentElement = (boardNode: IBoardNode): boardNode is ContentElementUnion => {
	const result: boolean =
		boardNode instanceof CollaborativeTextEditorElement ||
		boardNode instanceof DrawingElement ||
		boardNode instanceof ExternalToolElement ||
		boardNode instanceof FileElement ||
		boardNode instanceof FileFolderElement ||
		boardNode instanceof LinkElement ||
		boardNode instanceof RichTextElement ||
		boardNode instanceof DeletedElement ||
		boardNode instanceof VideoConferenceElement ||
		boardNode instanceof H5pElement;

	return result;
};

/**
 * Board node union type for type guards.
 */
export type BoardNodeUnion = ContentElementUnion | Card | Column | ColumnBoard | CollaborativeTextEditorElement;
