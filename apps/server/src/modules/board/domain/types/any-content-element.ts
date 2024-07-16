import { type CollaborativeTextEditorElement, isCollaborativeTextEditorElement } from '../collaborative-text-editor.do';
import { type DrawingElement, isDrawingElement } from '../drawing-element.do';
import { type ExternalToolElement, isExternalToolElement } from '../external-tool-element.do';
import { type FileElement, isFileElement } from '../file-element.do';
import { isLinkElement, type LinkElement } from '../link-element.do';
import { isRichTextElement, type RichTextElement } from '../rich-text-element.do';
import { isSubmissionContainerElement, type SubmissionContainerElement } from '../submission-container-element.do';
import { type AnyBoardNode } from './any-board-node';

export type AnyContentElement =
	| CollaborativeTextEditorElement
	| DrawingElement
	| ExternalToolElement
	| FileElement
	| LinkElement
	| RichTextElement
	| SubmissionContainerElement;

export const isContentElement = (boardNode: AnyBoardNode): boardNode is AnyContentElement => {
	const result =
		isCollaborativeTextEditorElement(boardNode) ||
		isDrawingElement(boardNode) ||
		isExternalToolElement(boardNode) ||
		isFileElement(boardNode) ||
		isLinkElement(boardNode) ||
		isRichTextElement(boardNode) ||
		isSubmissionContainerElement(boardNode);

	return result;
};
