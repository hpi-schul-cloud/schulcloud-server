import type { EntityId, InputFormat } from '@shared/domain/types';
import type { MediaBoardColors } from '../media-board';
import type { AnyBoardNode } from './any-board-node';
import type { BoardExternalReference } from './board-external-reference';
import { BoardLayout } from './board-layout.enum';
import { ContentElementType } from './content-element-type.enum';

export interface BoardNodeProps {
	id: EntityId;
	path: string;
	level: number;
	position: number;
	children: AnyBoardNode[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ColumnBoardProps extends BoardNodeProps {
	title: string;
	context: BoardExternalReference;
	isVisible: boolean;
	layout: BoardLayout;
}

export interface ColumnProps extends BoardNodeProps {
	title?: string;
}

export interface CardProps extends BoardNodeProps {
	title?: string;
	height: number;
}

export interface CollaborativeTextEditorElementProps extends BoardNodeProps {}

export interface DrawingElementProps extends BoardNodeProps {
	description: string;
}

export interface ExternalToolElementProps extends BoardNodeProps {
	contextExternalToolId?: string;
}

export interface FileElementProps extends BoardNodeProps {
	alternativeText?: string;
	caption?: string;
}
export interface LinkElementProps extends BoardNodeProps {
	title: string;
	url: string;
	description?: string;
	imageUrl?: string;
}

export interface RichTextElementProps extends BoardNodeProps {
	text: string;
	inputFormat: InputFormat;
}

export interface SubmissionContainerElementProps extends BoardNodeProps {
	dueDate?: Date;
}

export interface SubmissionItemProps extends BoardNodeProps {
	completed: boolean;
	userId: EntityId;
}

export interface DeletedElementProps extends BoardNodeProps {
	title: string;
	deletedElementType: ContentElementType;
	description?: string;
}

export interface MediaBoardProps extends BoardNodeProps {
	context: BoardExternalReference;
	backgroundColor: MediaBoardColors;
	collapsed: boolean;
	layout: BoardLayout;
}

// TODO use only one interface for media-external-tool and external-tool
export interface MediaExternalToolElementProps extends BoardNodeProps {
	contextExternalToolId: string;
}

export interface MediaLineProps extends BoardNodeProps {
	backgroundColor: MediaBoardColors;
	collapsed: boolean;
	title: string;
}

export type MediaBoardNodeProps = MediaBoardProps | MediaExternalToolElementProps | MediaLineProps;

export type AnyBoardNodeProps =
	| CardProps
	| CollaborativeTextEditorElementProps
	| ColumnBoardProps
	| ColumnProps
	| DrawingElementProps
	| ExternalToolElementProps
	| FileElementProps
	| LinkElementProps
	| RichTextElementProps
	| SubmissionContainerElementProps
	| SubmissionItemProps
	| MediaBoardNodeProps;
