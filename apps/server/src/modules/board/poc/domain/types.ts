import { BoardExternalReference } from '@shared/domain/domainobject';
import { BoardNodeType } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import type { Card } from './card.do';
import type { ColumnBoard } from './colum-board.do';
import type { Column } from './column.do';

export interface BoardNodeProps {
	id: EntityId;
	path: string;
	level: number;
	position: number;
	// type: BoardNodeType;
	children: AnyBoardNode[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ColumnBoardProps extends BoardNodeProps {
	// needed to ensure the right type
	type: BoardNodeType.COLUMN_BOARD;
	title: string;
	context: BoardExternalReference;
	isVisible: boolean;
}
export interface ColumnProps extends BoardNodeProps {
	type: BoardNodeType.COLUMN;
	title?: string;
}
export interface CardProps extends BoardNodeProps {
	type: BoardNodeType.CARD;
	title?: string;
	height: number;
}

export type AnyBoardNode = ColumnBoard | Card | Column;
export type AnyBoardNodeProps = ColumnBoardProps | CardProps | ColumnProps;
