import type { EntityId } from '@shared/domain/types';
import type { AnyBoardNode } from './any-board-node';
import type { BoardExternalReference } from './board-external-reference';
import { BoardLayout } from './board-layout.enum';
import { InputFormat } from './input-format.enum';

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

export interface RichTextElementProps extends BoardNodeProps {
	text: string;
	inputFormat: InputFormat;
}

export type AnyBoardNodeProps = ColumnBoardProps | CardProps | ColumnProps | RichTextElementProps;
