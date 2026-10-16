import { type EntityId } from '@shared/domain/types';
import type { CollaborativeTextEditorElement } from '../collaborative-text-editor.do';
import type { DeletedElement } from '../deleted-element.do';
import type { DrawingElement } from '../drawing-element.do';
import type { ExternalToolElement } from '../external-tool-element.do';
import type { FileElement } from '../file-element.do';
import type { FileFolderElement } from '../file-folder-element.do';
import type { H5pElement } from '../h5p-element.do';
import type { LinkElement } from '../link-element.do';
import type { RichTextElement } from '../rich-text-element.do';
import type { VideoConferenceElement } from '../video-conference-element.do';
import { type BoardExternalReferenceType } from './board-external-reference';

export type AnyContentElement =
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

// NOTE: isContentElement guard has been moved to ../guards/board-node.guards.ts
// to break circular dependencies. Import it from there or from domain/index.ts

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
