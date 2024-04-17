import { BoardNodeType } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import type { Card } from './card.do';
import type { ColumnBoard } from './colum-board.do';

export interface BoardNodeProps {
	id: EntityId;
	path: string;
	level: number;
	position: number;
	type: BoardNodeType;
	children: AnyBoardNode[];
	createdAt: Date;
	updatedAt: Date;
}

export interface ColumnBoardProps extends BoardNodeProps {
	title: string;
	// context: BoardExternalReference;
	isVisible: boolean;
}
export interface CardProps extends BoardNodeProps {
	title?: string;
	height: number;
}

export type AnyBoardNode = ColumnBoard | Card;
export type AnyBoardNodeProps = ColumnBoardProps | CardProps;
