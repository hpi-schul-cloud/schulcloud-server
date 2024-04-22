import { CollaborativeTextEditorElement } from '../collaborative-text-editor-element.do';
import { DrawingElement } from '../drawing-element.do';
import { ExternalToolElement } from '../external-tool-element.do';
import { FileElement } from '../file-element.do';
import { LinkElement } from '../link-element.do';
import { RichTextElement } from '../rich-text-element.do';
import { SubmissionContainerElement } from '../submission-container-element.do';
import type { AnyBoardDo } from './any-board-do';

export type AnyContentElementDo =
	| CollaborativeTextEditorElement
	| DrawingElement
	| ExternalToolElement
	| FileElement
	| LinkElement
	| RichTextElement
	| SubmissionContainerElement;

export const isAnyContentElement = (element: AnyBoardDo): element is AnyContentElementDo => {
	const result =
		element instanceof CollaborativeTextEditorElement ||
		element instanceof DrawingElement ||
		element instanceof ExternalToolElement ||
		element instanceof FileElement ||
		element instanceof LinkElement ||
		element instanceof RichTextElement ||
		element instanceof SubmissionContainerElement;

	return result;
};
