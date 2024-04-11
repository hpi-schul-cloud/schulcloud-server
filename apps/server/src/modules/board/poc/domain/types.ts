import { BoardNodeType } from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import type { Card } from './card.do';

export type AnyBoardNode = Card; // union type. add more types

export interface BoardNodeProps {
	id: EntityId;
	path: string;
	level: number;
	position: number;
	type: BoardNodeType;
	title?: string;
	children: AnyBoardNode[];
	createdAt: Date;
	updatedAt: Date;
}

export interface CardProps extends BoardNodeProps {
	height: number;
}

export type AnyBoardNodeProps = CardProps; // union (or intersection?) type. add more types
