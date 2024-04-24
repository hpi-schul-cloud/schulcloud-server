import type { EntityId } from '@shared/domain/types';
import type { BoardExternalReference } from './board-external-reference';
import type { AnyBoardNode, BoardNodeType } from './board-node-type';

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

export type AnyBoardNodeProps = ColumnBoardProps | CardProps | ColumnProps;
