import { EntityId } from '@shared/domain/types';
import { type CollaborativeTextEditorElement, isCollaborativeTextEditorElement } from '../collaborative-text-editor.do';
import { type DeletedElement, isDeletedElement } from '../deleted-element.do';
import { type DrawingElement, isDrawingElement } from '../drawing-element.do';
import { type ExternalToolElement, isExternalToolElement } from '../external-tool-element.do';
import { type FileElement, isFileElement } from '../file-element.do';
import { type FileFolderElement, isFileFolderElement } from '../file-folder-element.do';
import { isLinkElement, type LinkElement } from '../link-element.do';
import { isRichTextElement, type RichTextElement } from '../rich-text-element.do';
import { isSubmissionContainerElement, type SubmissionContainerElement } from '../submission-container-element.do';
import { isVideoConferenceElement, type VideoConferenceElement } from '../video-conference-element.do';
import { type AnyBoardNode } from './any-board-node';
import { BoardExternalReferenceType } from './board-external-reference';

export type AnyContentElement =
	| CollaborativeTextEditorElement
	| DrawingElement
	| ExternalToolElement
	| FileElement
	| FileFolderElement
	| LinkElement
	| RichTextElement
	| SubmissionContainerElement
	| DeletedElement
	| VideoConferenceElement;

export const isContentElement = (boardNode: AnyBoardNode): boardNode is AnyContentElement => {
	const result =
		isCollaborativeTextEditorElement(boardNode) ||
		isDrawingElement(boardNode) ||
		isExternalToolElement(boardNode) ||
		isFileElement(boardNode) ||
		isFileFolderElement(boardNode) ||
		isLinkElement(boardNode) ||
		isRichTextElement(boardNode) ||
		isSubmissionContainerElement(boardNode) ||
		isDeletedElement(boardNode) ||
		isVideoConferenceElement(boardNode);

	return result;
};

// @TODO check namings
export enum ElementReferenceType {
	BOARD = 'board',
}

export type ParentNodeType = BoardExternalReferenceType | ElementReferenceType;

export interface ParentNodeInfo {
	readonly id: EntityId;
	readonly type: ParentNodeType;
	readonly name: string;
	readonly child?: ParentNodeInfo;
}

export interface ContentElementWithParentHierarchy {
	readonly element: AnyContentElement;
	readonly parentHierarchy: ParentNodeInfo[];
}
